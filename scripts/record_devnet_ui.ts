/**
 * Headed Chromium walkthrough of the redesigned Next.js UI against Devnet.
 * Injects the throwaway deployer via window.__GHOST_DEV_WALLET__ (never logged).
 *
 * Expects frontend :3000 and relayer :3001, with NEXT_PUBLIC_ENABLE_DEV_WALLET=true
 * and the local demo relayer authorized on-chain.
 *
 *   AUTHORITY_KEYPAIR_PATH=.keys/devnet-deployer.json \
 *     npx tsx scripts/record_devnet_ui.ts
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Keypair } from "@solana/web3.js";
import { chromium, type Page } from "playwright-core";

const ROOT = join(import.meta.dirname, "..");
const ARTIFACTS = "/opt/cursor/artifacts";
const VIDEO_DIR = "/tmp/ghost-record";
const UI = process.env.UI_URL || "http://127.0.0.1:3000";
const RAW_WEBM = join(VIDEO_DIR, "ghost_devnet_ui_raw.webm");
const OUT_MP4 = join(ARTIFACTS, "ghost_devnet_deposit_withdraw.mp4");

function loadAuthority(): Keypair {
  const path =
    process.env.AUTHORITY_KEYPAIR_PATH || join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(path)) throw new Error("AUTHORITY_KEYPAIR_PATH missing");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

function ffmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(ARTIFACTS, name), fullPage: true });
  console.log("screenshot", name);
}

async function ensureConnected(page: Page) {
  const connectedMarker = page.getByTestId("ghost-dev-wallet-connected");
  try {
    await connectedMarker.waitFor({ state: "attached", timeout: 3_000 });
    return;
  } catch {
    /* fall through */
  }
  if (!(await page.getByTestId("use-dev-wallet").count())) {
    await page.goto(`${UI}/login`, { waitUntil: "domcontentloaded" });
  }
  await page.getByTestId("use-dev-wallet").click({ timeout: 8_000 });
  await Promise.race([
    connectedMarker.waitFor({ state: "attached", timeout: 20_000 }),
    page.waitForURL(/\/app/, { timeout: 20_000 }),
  ]);
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });
  const kp = loadAuthority();
  const secret = [...kp.secretKey];
  const recipient = Keypair.generate().publicKey.toBase58();
  console.log("injected wallet:", kp.publicKey.toBase58());
  console.log("fresh recipient:", recipient);

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
      "--window-position=0,0",
    ],
  });

  const recordVideo = process.env.SKIP_PW_VIDEO === "1"
    ? undefined
    : { dir: VIDEO_DIR, size: { width: 1440, height: 900 } };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo,
  });

  await context.addInitScript((bytes: number[]) => {
    (window as unknown as { __GHOST_DEV_WALLET__?: number[] }).__GHOST_DEV_WALLET__ = bytes;
  }, secret);

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("console", (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (t === "error" || t === "warning" || text.includes("[ghost]")) {
      console.log("browser", t, text);
    }
  });
  page.on("pageerror", (e) => console.log("pageerror", e.message));

  try {
    await page.goto(UI, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "landing-desktop-1440.png");

    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 420) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y);
      await page.waitForTimeout(350);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(400);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await shot(page, "landing-mobile-390.png");
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${UI}/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "login-desktop-1440.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await shot(page, "login-mobile-390.png");
    await page.setViewportSize({ width: 1440, height: 900 });

    await ensureConnected(page);
    console.log(
      "connected as",
      (await page.getByTestId("ghost-dev-wallet-connected").textContent())?.trim(),
    );

    await page.goto(`${UI}/app`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "app-overview-desktop-1440.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await shot(page, "app-overview-mobile-390.png");
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${UI}/app/deposit`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.getByTestId("deposit-submit").click();
    await page.getByTestId("deposit-note").waitFor({ timeout: 180_000 });
    const noteText = (await page.getByTestId("deposit-note").innerText()) ?? "";
    const noteMatch = noteText.match(/ghost:v1:\S+/);
    if (!noteMatch) throw new Error("Ghost Note not found after deposit");
    const note = noteMatch[0];
    const depositTx = noteText.match(/Tx:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/)?.[1] ?? "";
    console.log("UI deposit tx:", depositTx);

    await page.goto(`${UI}/app/withdraw`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "app-withdraw-desktop-1440.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await shot(page, "app-withdraw-mobile-390.png");
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.locator("#note").fill(note);
    await page.locator("#recipient").fill(recipient);
    await page.getByTestId("withdraw-submit").click();
    await page.getByTestId("withdraw-result").waitFor({ timeout: 300_000 });
    const wstatus = (await page.getByTestId("withdraw-result").innerText()) ?? "";
    const withdrawTx = wstatus.match(/Tx:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/)?.[1] ?? "";
    console.log("UI withdraw tx:", withdrawTx);
    await page.locator("#note").fill("");
    await shot(page, "ghost_devnet_ui_video_end.png");
    await page.waitForTimeout(1500);
  } catch (err) {
    try {
      await page.screenshot({
        path: join(ARTIFACTS, `ghost_devnet_ui_failure_${Date.now()}.png`),
        fullPage: true,
      });
      console.log("page url", page.url());
      console.log("page text snippet:\n", (await page.locator("body").innerText()).slice(0, 2000));
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    const video = page.video();
    if (video) {
      try {
        await video.saveAs(RAW_WEBM);
        (globalThis as { __GHOST_VIDEO_PATH?: string }).__GHOST_VIDEO_PATH = RAW_WEBM;
      } catch (e) {
        console.warn("video.saveAs failed", e);
      }
    }
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    if (!existsSync(RAW_WEBM)) {
      const { readdirSync } = await import("node:fs");
      const found = readdirSync(VIDEO_DIR).find((f) => f.endsWith(".webm"));
      if (found) {
        (globalThis as { __GHOST_VIDEO_PATH?: string }).__GHOST_VIDEO_PATH = join(VIDEO_DIR, found);
      }
    }
  }

  const videoPath = (globalThis as { __GHOST_VIDEO_PATH?: string }).__GHOST_VIDEO_PATH;
  if (process.env.SKIP_PW_VIDEO === "1") {
    console.log("skipped playwright video (external screen recording)");
    return;
  }
  if (!videoPath || !existsSync(videoPath)) throw new Error("Playwright did not record a video");
  await ffmpeg([
    "-y",
    "-i",
    videoPath,
    "-vf",
    "scale=1440:-2",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "28",
    "-preset",
    "medium",
    "-movflags",
    "+faststart",
    "-an",
    OUT_MP4,
  ]);
  try {
    unlinkSync(videoPath);
  } catch {
    /* ignore */
  }
  if (existsSync(RAW_WEBM)) {
    try {
      unlinkSync(RAW_WEBM);
    } catch {
      /* ignore */
    }
  }
  console.log("saved", OUT_MP4);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
