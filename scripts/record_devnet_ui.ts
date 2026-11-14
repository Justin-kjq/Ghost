/**
 * Headless Chromium walkthrough of the Next.js UI against Devnet.
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
import { chromium } from "playwright-core";

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
      "--window-size=1280,800",
      "--window-position=0,0",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } },
  });

  await context.addInitScript((bytes: number[]) => {
    (window as any).__GHOST_DEV_WALLET__ = bytes;
    console.log("[ghost] injected wallet byte length", Array.isArray(bytes) ? bytes.length : -1);
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
  await page.goto(UI, { waitUntil: "domcontentloaded" });

  const injected = await page.evaluate(() => {
    const raw = (window as any).__GHOST_DEV_WALLET__;
    return { has: raw != null, len: Array.isArray(raw) ? raw.length : -1 };
  });
  console.log("window.__GHOST_DEV_WALLET__", injected);
  const buttons = await page.locator("button").allTextContents();
  console.log("buttons:", buttons);

  const connectedMarker = page.getByTestId("ghost-dev-wallet-connected");
  try {
    await connectedMarker.waitFor({ state: "attached", timeout: 12_000 });
  } catch {
    const labels = await page.locator("button").allTextContents();
    console.log("buttons after wait:", labels);
    if (labels.some((t) => /^Connect$/i.test(t.trim()))) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find(
          (b) => b.textContent?.trim() === "Connect",
        );
        (btn as HTMLButtonElement | undefined)?.click();
      });
    } else if (labels.some((t) => /Select Wallet/i.test(t))) {
      await page.getByRole("button", { name: /Select Wallet/i }).first().click({ timeout: 5_000, force: true });
      await page.waitForTimeout(800);
      const ghost = page.getByText("Ghost Dev Wallet", { exact: false });
      if (await ghost.count()) {
        await ghost.first().click({ timeout: 5_000, force: true });
      }
      const connect2 = page.getByRole("button", { name: /^Connect$/ });
      if (await connect2.count()) {
        await connect2.first().click({ timeout: 5_000, force: true });
      }
    }
    await connectedMarker.waitFor({ state: "attached", timeout: 15_000 });
  }
  console.log("connected as", (await connectedMarker.textContent())?.trim());
  await page.waitForTimeout(800);

  await page.getByRole("button", { name: /Deposit 1 USDC/i }).click();
  await page.waitForSelector("text=SAVE YOUR GHOST NOTE", { timeout: 180_000 });
  const status = await page.locator(".status").first().innerText();
  const noteMatch = status.match(/ghost:v1:\S+/);
  if (!noteMatch) throw new Error("Ghost Note not found in deposit status");
  const note = noteMatch[0];
  const depositTx = status.match(/Tx:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/)?.[1] ?? "";
  console.log("UI deposit tx:", depositTx);

  await page.getByRole("button", { name: /^Withdraw$/i }).click();
  await page.locator("#note").fill(note);
  await page.locator("#recipient").fill(recipient);
  await page.getByRole("button", { name: /Generate proof & withdraw/i }).click();
  await page.waitForSelector("text=Withdraw submitted", { timeout: 300_000 });
  const wstatus = await page.locator(".status").last().innerText();
  const withdrawTx = wstatus.match(/Tx:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/)?.[1] ?? "";
  console.log("UI withdraw tx:", withdrawTx);
  console.log("UI withdraw status:\n", wstatus);

  await page.screenshot({
    path: join(ARTIFACTS, "ghost_devnet_ui_video_end.png"),
    fullPage: true,
  });
  await page.waitForTimeout(2000);
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
    await context.close().catch(() => undefined);
    if (video) {
      await video.saveAs(RAW_WEBM);
      (globalThis as any).__GHOST_VIDEO_PATH = RAW_WEBM;
    }
    await browser.close().catch(() => undefined);
  }

  const videoPath = (globalThis as any).__GHOST_VIDEO_PATH as string | undefined;
  if (!videoPath || !existsSync(videoPath)) throw new Error("Playwright did not record a video");
  await ffmpeg([
    "-y",
    "-i",
    videoPath,
    "-vf",
    "scale=1280:-2",
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
