/** Links and on-chain proof data for the marketing landing. */

import { LINKS } from "@/lib/links";

/** Marketing CTAs land on login so the wallet connector never opens elsewhere. */
export const APP_URL = LINKS.login;
export const REPO_URL = LINKS.github;

export const SCAN = "https://explorer.solana.com";
export const CLUSTER = "devnet";

export function explorerAddress(address: string) {
  return `${SCAN}/address/${address}?cluster=${CLUSTER}`;
}

export function explorerTx(signature: string) {
  return `${SCAN}/tx/${signature}?cluster=${CLUSTER}`;
}

export const contracts = [
  {
    name: "ghost_pool",
    address: "69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR",
    tags: ["Privacy pool", "Poseidon notes"],
  },
  {
    name: "Pool PDA",
    address: "DbMcqri6ScZSnQBpDATapaWWUfUGTiytyMuzZrZKpZCr",
    tags: ["Config", "Merkle index"],
  },
  {
    name: "Vault ATA",
    address: "GDhkKy7KupmP9w24XhinatErS8R6ejea95brgKX2z9uR",
    tags: ["USDC vault"],
  },
  {
    name: "Relayer",
    address: "EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf",
    tags: ["Fee payer", "ZK gate"],
  },
  {
    name: "Mock USDC",
    address: "GLfrBSjkzFQZJrWEcWfA9j1yapabGYTwdcNJKAgqWeCt",
    tags: ["SPL mint", "6 decimals"],
  },
];

export const transactions = [
  {
    name: "UI deposit",
    hash: "hhpGJ73UU2Nj4SMyPevcGS8PMamC7CvJf6WbUXDTuve1vH9p5Jwp7jVbgmkVsLGWodRKN1PkMvD1wqjmztTvQbC",
    tags: ["1 USDC", "Ghost Note issued"],
  },
  {
    name: "UI withdraw",
    hash: "5uWUc9DXn1bURdDAZzSoqNN3x5zpdsgwiAmxMin8867Vv6uvKGhKWaCTg5NE6RFVBmcGxeHhxcWYhFND86iitYWp",
    tags: ["0 SOL from recipient", "Relayer paid fees"],
  },
];
