
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit3, Trash2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Project Ideas",
      content: "Some great ideas for the next quarter:\n- Implement drag and drop\n- Add calendar integration\n- Create mobile app",
      tags: ["work", "ideas"],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      title: "Meeting Notes",
      content: "Team meeting today discussed:\n- Sprint planning\n- Code review process\n- New hiring requirements",
      tags: ["meetings", "work"],
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 172800000),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const createNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        tags: newNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([note, ...notes]);
      setNewNote({ title: "", content: "", tags: "" });
      setIsCreating(false);
      toast({
        title: "Note created",
        description: `"${note.title}" has been created successfully.`,
      });
    }
  };

  const updateNote = () => {
    if (editingNote && newNote.title.trim() && newNote.content.trim()) {
      const updatedNote: Note = {
        ...editingNote,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        tags: newNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        updatedAt: new Date(),
      };
      setNotes(notes.map(note => note.id === editingNote.id ? updatedNote : note));
      setEditingNote(null);
      setNewNote({ title: "", content: "", tags: "" });
      toast({
        title: "Note updated",
        description: `"${updatedNote.title}" has been updated successfully.`,
      });
    }
  };

  const deleteNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    setNotes(notes.filter(note => note.id !== id));
    toast({
      title: "Note deleted",
      description: `"${note?.title}" has been deleted.`,
    });
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingNote(null);
    setNewNote({ title: "", content: "", tags: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notes</h2>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {(isCreating || editingNote) && (
        <Card className="p-6 animate-fade-in">
          <div className="space-y-4">
            <Input
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={6}
            />
            <Input
              placeholder="Tags (comma separated)..."
              value={newNote.tags}
              onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={editingNote ? updateNote : createNote}>
                {editingNote ? "Update Note" : "Create Note"}
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg line-clamp-1">{note.title}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(note)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.content}
              </p>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {format(note.updatedAt, "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "No notes found" : "No notes yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? `Try searching for something else or create a new note.`
              : "Create your first note to get started!"}
          </p>
        </Card>
      )}
    </div>
  );
}
