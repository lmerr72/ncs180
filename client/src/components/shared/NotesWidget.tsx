import { timeAgo } from "@/helpers/formatters";
import { Note } from "@/types/api";
import { Clock, Plus, StickyNote } from "lucide-react";
import { useState } from "react";

const SEED_NOTES: Note[] = [
    { id: "n1", text: "Client prefers morning calls — best time is 9–10 AM MT. Ask for Jennifer directly.", author: "Gordon Marshall", timestamp: "2026-01-14T09:30:00Z" },
    { id: "n2", text: "Q1 renewal discussion went well. They're looking to expand to two more properties in Q3.", author: "Gordon Marshall", timestamp: "2026-02-20T14:15:00Z" },
  ];

export default function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [noteText, setNoteText] = useState("");

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const note: Note = {
        id: `n${Date.now()}`,
        text: noteText.trim(),
        author: `${user?.firstName ?? "Unknown"} ${user?.lastName ?? "User"}`,
        timestamp: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    // addAudit("Added a note", "note");
    // hippo add audit entry
    setNoteText("");
}

    return    (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
    <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
      <StickyNote className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Notes</h2>
      <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{notes.length}</span>
    </div>

    {/* Add note */}
    <form onSubmit={handleAddNote} className="px-5 py-4 border-b border-border/50 bg-muted/10">
      <textarea
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Add a note about this client..."
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!noteText.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Note
        </button>
      </div>
    </form>

    {/* Notes list */}
    <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-80">
      {notes.length === 0 && (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
      )}
      {notes.map(note => (
        <div key={note.id} className="px-5 py-4">
          <p className="text-sm text-foreground leading-relaxed mb-2">{note.text}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {note.author} · {timeAgo(note.timestamp)}
          </p>
        </div>
      ))}
    </div>
  </div>)
}