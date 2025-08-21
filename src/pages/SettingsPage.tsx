import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, Palette, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface SortablePriorityItemProps {
  priority: CustomPriority;
  onDelete: (id: string, name: string) => void;
  getPriorityStyle: (color: string) => any;
}

function SortablePriorityItem({ priority, onDelete, getPriorityStyle }: SortablePriorityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 bg-background"
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: priority.color }}
        />
        <Badge 
          variant="outline"
          style={getPriorityStyle(priority.color)}
          className="capitalize"
        >
          {priority.name}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(priority.id, priority.name)}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [priorities, setPriorities] = useState<CustomPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState("");
  const [newPriorityColor, setNewPriorityColor] = useState("#6b7280");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const colorOptions = [
    { name: "Gray", value: "#6b7280" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
  ];

  useEffect(() => {
    fetchPriorities();
  }, []);

  const fetchPriorities = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_priorities')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching priorities",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setPriorities(data || []);
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
      toast({
        title: "Error fetching priorities",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPriority = async () => {
    if (!newPriorityName.trim()) {
      toast({
        title: "Invalid name",
        description: "Priority name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive"
        });
        return;
      }

      const maxOrder = Math.max(...priorities.map(p => p.sort_order), 0);

      const { data, error } = await supabase
        .from('custom_priorities')
        .insert({
          name: newPriorityName.trim().toLowerCase(),
          color: newPriorityColor,
          sort_order: maxOrder + 1,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Priority already exists",
            description: "You already have a priority with this name",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error adding priority",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        setPriorities([...priorities, data]);
        setNewPriorityName("");
        setNewPriorityColor("#6b7280");
        setIsAddingPriority(false);
        toast({
          title: "Priority added",
          description: `"${data.name}" priority has been created`,
        });
      }
    } catch (error) {
      console.error('Error adding priority:', error);
      toast({
        title: "Error adding priority",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const deletePriority = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('custom_priorities')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting priority",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setPriorities(priorities.filter(p => p.id !== id));
        toast({
          title: "Priority deleted",
          description: `"${name}" priority has been removed`,
        });
      }
    } catch (error) {
      console.error('Error deleting priority:', error);
      toast({
        title: "Error deleting priority",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = priorities.findIndex((priority) => priority.id === active.id);
      const newIndex = priorities.findIndex((priority) => priority.id === over?.id);

      const newPriorities = arrayMove(priorities, oldIndex, newIndex);
      
      // Update sort_order for all affected priorities
      const updatesPromises = newPriorities.map((priority, index) => 
        supabase
          .from('custom_priorities')
          .update({ sort_order: index })
          .eq('id', priority.id)
      );

      try {
        await Promise.all(updatesPromises);
        setPriorities(newPriorities.map((p, index) => ({ ...p, sort_order: index })));
        toast({
          title: "Priority order updated",
          description: "Your priority order has been saved",
        });
      } catch (error) {
        console.error('Error updating priority order:', error);
        toast({
          title: "Error updating order",
          description: "Failed to save new priority order",
          variant: "destructive"
        });
      }
    }
  };

  const getPriorityStyle = (color: string) => ({
    backgroundColor: color + '20',
    borderColor: color + '50',
    color: color
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and configurations</p>
        </div>
      </div>

      {/* Priority Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Priority Management
          </CardTitle>
          <CardDescription>
            Create and customize your todo priority levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Priorities</h3>
            <Dialog open={isAddingPriority} onOpenChange={setIsAddingPriority}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Priority
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Priority</DialogTitle>
                  <DialogDescription>
                    Create a custom priority level for your todos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="priority-name">Priority Name</Label>
                    <Input
                      id="priority-name"
                      placeholder="e.g., urgent, critical, optional"
                      value={newPriorityName}
                      onChange={(e) => setNewPriorityName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority-color">Color</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewPriorityColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newPriorityColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Input
                      id="priority-color"
                      type="color"
                      value={newPriorityColor}
                      onChange={(e) => setNewPriorityColor(e.target.value)}
                      className="mt-2 w-20 h-10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingPriority(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addPriority}>Add Priority</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {priorities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No custom priorities yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag and drop to reorder priorities. This affects how todos are sorted.
                </p>
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={priorities}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {priorities.map((priority) => (
                        <SortablePriorityItem
                          key={priority.id}
                          priority={priority}
                          onDelete={deletePriority}
                          getPriorityStyle={getPriorityStyle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Future Settings Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>
            More configuration options coming soon...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Additional settings and configurations will be available here in future updates.</p>
        </CardContent>
      </Card>
    </div>
  );
}