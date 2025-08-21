import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CustomPriority {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AddSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string, priority: string) => void;
  priorities: CustomPriority[];
  parentTaskText: string;
}

export function AddSubtaskModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  priorities, 
  parentTaskText 
}: AddSubtaskModalProps) {
  const [subtaskText, setSubtaskText] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(
    priorities.length > 0 ? priorities[0].name : "medium"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskText.trim()) {
      onAdd(subtaskText.trim(), selectedPriority);
      setSubtaskText("");
      onClose();
    }
  };

  const handleClose = () => {
    setSubtaskText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subtask</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adding subtask to: <span className="font-medium">{parentTaskText}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subtask-text">Subtask</Label>
              <Input
                id="subtask-text"
                placeholder="Enter subtask description..."
                value={subtaskText}
                onChange={(e) => setSubtaskText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.name} className="capitalize">
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!subtaskText.trim()}>
              Add Subtask
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}