import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildDir = join(__dirname, "..", "build");
mkdirSync(buildDir, { recursive: true });

const ptau = join(buildDir, "pot15_final.ptau");
if (existsSync(ptau)) {
  console.log("pot15_final.ptau already exists");
  process.exit(0);
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: buildDir, stdio: "inherit", shell: true });
}

run("npx snarkjs powersoftau new bn128 15 pot15_0000.ptau -v");
run('npx snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau --name="ghost" -e="ghost-random"');
run("npx snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau -v");
console.log("\nptau ready:", ptau);
