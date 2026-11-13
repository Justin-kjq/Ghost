import { TREE_DEPTH, ZERO_LEAF } from "./constants";
import { getPoseidon, poseidon2 } from "./poseidon";

export interface MerklePath {
  pathElements: bigint[];
  pathIndices: number[];
  root: bigint;
}

let _zeros: bigint[] | null = null;

export async function getZeros(): Promise<bigint[]> {
  if (_zeros) return _zeros;
  const zeros: bigint[] = [ZERO_LEAF];
  for (let i = 1; i <= TREE_DEPTH; i++) {
    zeros.push(await poseidon2(zeros[i - 1], zeros[i - 1]));
  }
  _zeros = zeros;
  return zeros;
}

export async function buildMerkleTree(commitments: { leafIndex: number; commitment: bigint }[]): Promise<{
  layers: bigint[][];
  root: bigint;
}> {
  const zeros = await getZeros();
  const poseidon = await getPoseidon();
  const leaves: bigint[] = Array(2 ** TREE_DEPTH).fill(zeros[0]);
  for (const c of commitments) {
    if (c.leafIndex < 0 || c.leafIndex >= leaves.length) {
      throw new Error(`leafIndex out of range: ${c.leafIndex}`);
    }
    leaves[c.leafIndex] = c.commitment;
  }

  const layers: bigint[][] = [leaves];
  for (let depth = 0; depth < TREE_DEPTH; depth++) {
    const prev = layers[depth];
    const next: bigint[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(poseidon([prev[i] ?? zeros[depth], prev[i + 1] ?? zeros[depth]]));
    }
    layers.push(next);
  }

  return { layers, root: layers[TREE_DEPTH][0] };
}

export async function getMerklePath(
  commitments: { leafIndex: number; commitment: bigint }[],
  targetLeafIndex: number,
): Promise<MerklePath> {
  const zeros = await getZeros();
  const { layers, root } = await buildMerkleTree(commitments);
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = targetLeafIndex;

  for (let depth = 0; depth < TREE_DEPTH; depth++) {
    const isRight = idx % 2;
    const sibling = isRight ? idx - 1 : idx + 1;
    pathIndices.push(isRight);
    pathElements.push(layers[depth][sibling] ?? zeros[depth]);
    idx = Math.floor(idx / 2);
  }

  return { pathElements, pathIndices, root };
}
