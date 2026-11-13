import { buildPoseidon } from "circomlibjs";

type PoseidonFn = (inputs: (bigint | number | string)[]) => bigint;

let _poseidon: PoseidonFn | null = null;

export async function getPoseidon(): Promise<PoseidonFn> {
  if (_poseidon) return _poseidon;
  const p = await buildPoseidon();
  _poseidon = (inputs) => p.F.toObject(p(inputs.map((x) => BigInt(x))));
  return _poseidon;
}

export async function poseidon1(a: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  return poseidon([a]);
}

export async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  return poseidon([a, b]);
}
