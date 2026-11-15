"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "Does the recipient need SOL?",
    a: "No. The relayer pays Solana fees. The recipient can be a fresh address with a zero SOL balance and still receive 0.997 USDC.",
  },
  {
    q: "Who sees the Ghost Note?",
    a: "Only you. Proofs are generated in the browser. The relayer never needs the note — sending it would let a curious relayer link your deposit to your withdraw.",
  },
  {
    q: "Is this trustless?",
    a: "Not yet. Groth16 and the Merkle tree are verified off-chain. A malicious relayer can drain the vault. Nullifier PDAs still stop the same note being spent twice.",
  },
  {
    q: "What is the denomination?",
    a: "Exactly 1 USDC per note (1,000,000 base units). The pool fee is 30 bps, so the recipient receives 0.997 USDC.",
  },
  {
    q: "Which network is this?",
    a: "Solana. Program id 69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR.",
  },
];

export function LandingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger className="font-serif text-lg hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
