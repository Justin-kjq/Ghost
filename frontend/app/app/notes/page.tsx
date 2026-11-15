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
import { PageHeader } from "@/components/page-header";

export default function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    setNotes(listNotes());
  }, []);

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
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        tag="Notes"
        title="The only key."
        description="Anyone with a Ghost Note can withdraw the matching 1 USDC. Export before clearing this browser."
      />

      <div className="flex flex-wrap gap-3">
        <Button size="pill" variant="outline" onClick={onExport}>
          Export JSON
        </Button>
        <Button
          size="pill"
          variant="outline"
          onClick={() => {
            void copy(exportNotes());
          }}
        >
          Copy all
        </Button>
      </div>

      <div className="overflow-x-auto border border-ink/15 bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="border-ink/15 hover:bg-transparent">
              <TableHead>Leaf</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-ink/50">
                  No notes yet. Deposit 1 USDC to receive one.
                </TableCell>
              </TableRow>
            )}
            {notes.map((n) => (
              <TableRow key={n.note} className="border-ink/10">
                <TableCell className="font-mono text-xs">{n.leafIndex}</TableCell>
                <TableCell className="max-w-[280px] truncate font-mono text-xs">
                  {shortAddr(n.note, 10)}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      n.spent
                        ? "text-ink/45"
                        : "inline-flex bg-sun px-2 py-0.5 text-[12px]"
                    }
                  >
                    {n.spent ? "Spent" : "Unspent"}
                  </span>
                </TableCell>
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

      <section className="border border-ink/15 bg-sand p-6 md:p-8">
        <span className="tag text-ink/60">Import</span>
        <Textarea
          className="mt-4 rounded-none border-ink/15 bg-paper font-mono text-xs"
          placeholder='[{"note":"ghost:v1:…"}]'
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <Button
          size="pill"
          className="mt-4"
          onClick={onImport}
          disabled={!importText.trim()}
        >
          Import
        </Button>
      </section>
    </div>
  );
}
