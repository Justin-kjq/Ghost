const NOTES_KEY = "ghost.notes.v1";

export type StoredNote = {
  note: string;
  leafIndex: number;
  commitment: string;
  depositTx?: string;
  createdAt: string;
  spent?: boolean;
  spendTx?: string;
};

function read(): StoredNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(notes: StoredNote[]) {
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function listNotes(): StoredNote[] {
  return read();
}

export function unspentNotes(): StoredNote[] {
  return read().filter((n) => !n.spent);
}

export function saveNote(note: StoredNote) {
  const next = [note, ...read().filter((n) => n.note !== note.note)];
  write(next);
}

export function markNoteSpent(noteRaw: string, spendTx?: string) {
  write(
    read().map((n) =>
      n.note === noteRaw ? { ...n, spent: true, spendTx } : n,
    ),
  );
}

export function importNotes(payload: string): number {
  const parsed = JSON.parse(payload) as StoredNote[] | StoredNote;
  const incoming = Array.isArray(parsed) ? parsed : [parsed];
  const existing = read();
  const byNote = new Map(existing.map((n) => [n.note, n]));
  for (const n of incoming) {
    if (n?.note) byNote.set(n.note, n);
  }
  write([...byNote.values()]);
  return incoming.length;
}

export function exportNotes(): string {
  return JSON.stringify(read(), null, 2);
}
