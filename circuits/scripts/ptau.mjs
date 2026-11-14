import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const circuitsRoot = join(__dirname, "..");
const buildDir = join(circuitsRoot, "build");
mkdirSync(buildDir, { recursive: true });

const ptau = join(buildDir, "pot15_final.ptau");
if (existsSync(ptau)) {
  console.log("pot15_final.ptau already exists");
  process.exit(0);
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  // snarkjs writes relative paths in the process cwd; pin it to build/
  execSync(cmd, { cwd: buildDir, stdio: "inherit", shell: true });
}

run("npx snarkjs powersoftau new bn128 15 pot15_0000.ptau -v");
run(
  'npx snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau --name="ghost" -e="ghost-random"',
);
run("npx snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau -v");

// Some npx invocations leak outputs into the package root; collect them.
for (const name of ["pot15_0000.ptau", "pot15_0001.ptau", "pot15_final.ptau"]) {
  const leaked = join(circuitsRoot, name);
  const wanted = join(buildDir, name);
  if (!existsSync(wanted) && existsSync(leaked)) {
    renameSync(leaked, wanted);
  }
}

if (!existsSync(ptau)) {
  console.error("ptau generation finished but pot15_final.ptau was not found in", buildDir);
  process.exit(1);
}
console.log("\nptau ready:", ptau);
