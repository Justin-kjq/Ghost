"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportNotes, importNotes, listNotes, type StoredNote } from "@/lib/notes";
import { shortAddr } from "@/lib/ghost";

export default function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  useEffect(() => {
    setNotes(listNotes());
  }, []);
  const [importText, setImportText] = useState("");

  function refresh() {
    setNotes(listNotes());
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied.");
  }

  function onExport() {
    const blob = new Blob([exportNotes()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ghost-notes.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport() {
    try {
      const n = importNotes(importText);
      refresh();
      toast.success(`Imported ${n} note(s).`);
      setImportText("");
    } catch {
      toast.error("Could not parse notes JSON.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-gold uppercase">Notes</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">The only key.</h1>
        <p className="mt-3 max-w-2xl text-sm text-destructive">
          A Ghost Note is a secret. Anyone who has it can withdraw the associated
          1 USDC. Ghost does not keep a copy on a server. Export before you clear
          this browser.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="pill" variant="outline" className="rounded-full" onClick={onExport}>
          Export JSON
        </Button>
        <Button
          size="pill"
          variant="outline"
          className="rounded-full"
          onClick={() => {
            void copy(exportNotes());
          }}
        >
          Copy all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leaf</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No notes in this browser yet. Deposit 1 USDC to receive one — then
                  export it before you clear storage.
                </TableCell>
              </TableRow>
            )}
            {notes.map((n) => (
              <TableRow key={n.note}>
                <TableCell className="font-mono text-xs">{n.leafIndex}</TableCell>
                <TableCell className="max-w-[280px] truncate font-mono text-xs">
                  {shortAddr(n.note, 10)}
                </TableCell>
                <TableCell>{n.spent ? "Spent" : "Unspent"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => copy(n.note)}>
                    Copy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Import</p>
        <Textarea
          className="font-mono text-xs"
          placeholder='[{"note":"ghost:v1:…"}]'
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <Button size="pill" onClick={onImport} disabled={!importText.trim()}>
          Import
        </Button>
      </div>
    </div>
  );
}
