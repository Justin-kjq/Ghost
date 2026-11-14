import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const buildDir = join(root, "build");
mkdirSync(buildDir, { recursive: true });

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

const circom = process.env.CIRCOM_PATH || "circom";
// circomlib is hoisted to the workspace root under npm workspaces.
run(
  `${circom} merkle_proof.circom --r1cs --wasm --sym -o build -l node_modules -l ../node_modules`,
);

const ptau = join(buildDir, "pot15_final.ptau");
if (!existsSync(ptau)) {
  console.error("Missing pot15_final.ptau — run: npm run ptau");
  process.exit(1);
}

run(`npx snarkjs groth16 setup build/merkle_proof.r1cs ${ptau} build/merkle_proof_0.zkey`);
run(`npx snarkjs zkey contribute build/merkle_proof_0.zkey build/merkle_proof_final.zkey -e="ghost-solana-lean-mvp"`);
run(`npx snarkjs zkey export verificationkey build/merkle_proof_final.zkey build/verification_key.json`);

const frontendZk = join(root, "..", "frontend", "public", "zk");
mkdirSync(frontendZk, { recursive: true });
copyFileSync(
  join(buildDir, "merkle_proof_js", "merkle_proof.wasm"),
  join(frontendZk, "merkle_proof.wasm"),
);
copyFileSync(join(buildDir, "merkle_proof_final.zkey"), join(frontendZk, "merkle_proof_final.zkey"));
copyFileSync(join(buildDir, "verification_key.json"), join(frontendZk, "verification_key.json"));

const relayerZk = join(root, "..", "relayer", "zk");
mkdirSync(relayerZk, { recursive: true });
copyFileSync(join(buildDir, "verification_key.json"), join(relayerZk, "verification_key.json"));

console.log("\nCircuit build complete. Artifacts copied to frontend/public/zk and relayer/zk.");
