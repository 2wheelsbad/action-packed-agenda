
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Trash2, Edit3, CheckSquare, Filter, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
  user_id: string;
  completed_at?: string;
}

interface SortableTodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: "low" | "medium" | "high") => void;
}

function SortableTodoItem({ todo, onToggle, onDelete, onEdit, onPriorityChange }: SortableTodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit(todo.id, editText);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`task-item p-4 ${todo.completed ? "opacity-60" : ""} ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          className="drag-handle text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className="flex-shrink-0"
        />

        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
                if (e.key === "Escape") {
                  setEditText(todo.text);
                  setIsEditing(false);
                }
              }}
              className="text-sm"
              autoFocus
            />
          ) : (
            <div>
              <p className={`text-sm ${todo.completed ? "line-through" : ""}`}>
                {todo.text}
              </p>
              {todo.completed && todo.completed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completed: {new Date(todo.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Badge className={`text-xs cursor-pointer ${getPriorityColor(todo.priority)}`}>
      {todo.priority}
    </Badge>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="z-[1000] bg-background border shadow-md">
    <DropdownMenuItem onClick={() => onPriorityChange(todo.id, "low")}>Low</DropdownMenuItem>
    <DropdownMenuItem onClick={() => onPriorityChange(todo.id, "medium")}>Medium</DropdownMenuItem>
    <DropdownMenuItem onClick={() => onPriorityChange(todo.id, "high")}>High</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(todo.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch todos from database
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching todos",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTodos((data || []) as Todo[]);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        title: "Error fetching todos",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      toast({
        title: "Todo reordered",
        description: "Your todo list has been updated.",
      });
    }
  };

  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to add todos",
            variant: "destructive"
          });
          return;
        }

        const { data, error } = await supabase
          .from('todos')
          .insert({
            text: newTodo.trim(),
            priority: newPriority,
            completed: false,
            user_id: user.id
          })
          .select()
          .single();

        if (error) {
          toast({
            title: "Error adding todo",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setTodos([data as Todo, ...todos]);
          setNewTodo("");
          toast({
            title: "Todo added",
            description: `"${data.text}" has been added to your list.`,
          });
        }
      } catch (error) {
        console.error('Error adding todo:', error);
        toast({
          title: "Error adding todo",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;
    const updateData = {
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null
    };

    try {
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast({
          title: "Error updating todo",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, completed: newCompleted, completed_at: updateData.completed_at } : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error updating todo",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const deleteTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting todo",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTodos(todos.filter(todo => todo.id !== id));
        toast({
          title: "Todo deleted",
          description: `"${todo?.text}" has been removed.`,
        });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error deleting todo",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const editTodo = async (id: string, text: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ text })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error updating todo",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, text } : todo
        ));
        toast({
          title: "Todo updated",
          description: "Your todo has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error updating todo",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
};

const updatePriority = async (id: string, priority: "low" | "medium" | "high") => {
  try {
    const { error } = await supabase
      .from('todos')
      .update({ priority })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating priority",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTodos(todos.map(t => t.id === id ? { ...t, priority } : t));
      toast({ title: "Priority updated", description: `Set to ${priority}.` });
    }
  } catch (error) {
    console.error('Error updating priority:', error);
    toast({
      title: "Error updating priority",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
  }
};

const filteredTodos = hideCompleted ? todos.filter(todo => !todo.completed) : todos;
const completedCount = todos.filter(todo => todo.completed).length;
const totalCount = todos.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Todo List</h2>
            <p className="text-muted-foreground">Loading todos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Todo List</h2>
          <p className="text-muted-foreground">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={hideCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setHideCompleted(!hideCompleted)}
            className="flex items-center gap-2"
          >
            {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideCompleted ? "Show Completed" : "Hide Completed"}
          </Button>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="flex-1"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button onClick={addTodo} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {filteredTodos.map((todo) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onPriorityChange={updatePriority}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredTodos.length === 0 && todos.length > 0 && (
        <Card className="p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks match your filter</h3>
          <p className="text-muted-foreground">Try adjusting your filter settings.</p>
        </Card>
      )}

      {todos.length === 0 && (
        <Card className="p-8 text-center">
          <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No todos yet</h3>
          <p className="text-muted-foreground">Add your first todo to get started!</p>
        </Card>
      )}
    </div>
  );
}
