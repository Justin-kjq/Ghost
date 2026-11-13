declare module "circomlibjs" {
  export function buildPoseidon(): Promise<{
    F: { toObject: (x: unknown) => bigint };
    (inputs: unknown[]): unknown;
  }>;
}

declare module "snarkjs" {
  export const groth16: {
    fullProve: (
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFile: string,
    ) => Promise<{ proof: any; publicSignals: string[] }>;
    verify: (
      vkey: object,
      publicSignals: string[],
      proof: object,
    ) => Promise<boolean>;
  };
}
