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
import { Plus, GripVertical, Trash2, Edit3, CheckSquare, Filter, Eye, EyeOff, ChevronRight, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddSubtaskModal } from "@/components/AddSubtaskModal";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  completed_at?: string;
  parent_id?: string;
  sort_order: number;
}

interface CustomPriority {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface HierarchicalTodo extends Todo {
  subtasks: Todo[];
  isExpanded: boolean;
}

interface SortableTodoItemProps {
  todo: HierarchicalTodo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onAddSubtask: (parentId: string) => void;
  onToggleExpand: (id: string) => void;
  priorities: CustomPriority[];
  level?: number;
}

function SortableTodoItem({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit, 
  onPriorityChange, 
  onAddSubtask, 
  onToggleExpand, 
  priorities, 
  level = 0 
}: SortableTodoItemProps) {
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

  const getPriorityColor = (priorityName: string) => {
    const priority = priorities.find(p => p.name === priorityName);
    if (priority) {
      return `border-2 text-white`;
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityStyle = (priorityName: string) => {
    const priority = priorities.find(p => p.name === priorityName);
    if (priority) {
      return {
        backgroundColor: priority.color + '20',
        borderColor: priority.color,
        color: priority.color
      };
    }
    return {};
  };

  const completedSubtasks = todo.subtasks.filter(st => st.completed).length;
  const totalSubtasks = todo.subtasks.length;

  return (
    <div style={{ marginLeft: `${level * 24}px` }}>
      <Card
        ref={setNodeRef}
        style={style}
        className={`task-item p-4 ${todo.completed ? "opacity-60" : ""} ${isDragging ? "shadow-lg" : ""} ${level > 0 ? "border-l-4 border-primary/30" : ""}`}
      >
        <div className="flex items-center gap-3">
          <button
            className="drag-handle text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {totalSubtasks > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(todo.id)}
              className="h-6 w-6 p-0"
            >
              {todo.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}

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
                {totalSubtasks > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedSubtasks}/{totalSubtasks} subtasks completed
                  </p>
                )}
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
              <button 
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer capitalize ${getPriorityColor(todo.priority)}`}
                style={getPriorityStyle(todo.priority)}
              >
                {todo.priority}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="bottom" 
              align="start" 
              className="z-[10000] bg-popover border border-border shadow-lg"
              sideOffset={5}
            >
              {priorities.map((priority) => (
                <DropdownMenuItem 
                  key={priority.id}
                  onClick={() => onPriorityChange(todo.id, priority.name)}
                  className="cursor-pointer"
                >
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: priority.color }}
                  ></span>
                  <span className="capitalize">{priority.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubtask(todo.id)}
              className="h-8 w-8 p-0"
              title="Add subtask"
            >
              <Plus className="w-3 h-3" />
            </Button>
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

      {/* Render subtasks if expanded */}
      {todo.isExpanded && todo.subtasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {todo.subtasks.map((subtask) => (
            <SortableTodoItem
              key={subtask.id}
              todo={{
                ...subtask,
                subtasks: [],
                isExpanded: false
              }}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onPriorityChange={onPriorityChange}
              onAddSubtask={onAddSubtask}
              onToggleExpand={onToggleExpand}
              priorities={priorities}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [priorities, setPriorities] = useState<CustomPriority[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTodos();
    fetchPriorities();
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
        if (data && data.length > 0) {
          setNewPriority(data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
      toast({
        title: "Error fetching priorities",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Organize todos into hierarchical structure
  const organizeHierarchicalTodos = (): HierarchicalTodo[] => {
    const parentTodos = todos.filter(todo => !todo.parent_id);
    
    return parentTodos.map(parent => {
      const subtasks = todos
        .filter(todo => todo.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      
      return {
        ...parent,
        subtasks,
        isExpanded: expandedTodos.has(parent.id)
      };
    });
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

  const addTodo = async (parentId?: string) => {
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

        const maxSortOrder = parentId 
          ? Math.max(...todos.filter(t => t.parent_id === parentId).map(t => t.sort_order), -1)
          : Math.max(...todos.filter(t => !t.parent_id).map(t => t.sort_order), -1);

        const { data, error } = await supabase
          .from('todos')
          .insert({
            text: newTodo.trim(),
            priority: newPriority,
            completed: false,
            user_id: user.id,
            parent_id: parentId,
            sort_order: maxSortOrder + 1
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
            title: parentId ? "Subtask added" : "Todo added",
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

  const openSubtaskModal = (parentId: string) => {
    const parentTask = todos.find(t => t.id === parentId);
    if (parentTask) {
      setSelectedParentTask(parentTask);
      setSubtaskModalOpen(true);
    }
  };

  const addSubtask = async (text: string, priority: string) => {
    if (!selectedParentTask) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const maxSortOrder = Math.max(...todos.filter(t => t.parent_id === selectedParentTask.id).map(t => t.sort_order), -1);

      const { data, error } = await supabase
        .from('todos')
        .insert({
          text: text,
          priority: priority,
          completed: false,
          user_id: user.id,
          parent_id: selectedParentTask.id,
          sort_order: maxSortOrder + 1
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error adding subtask",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setTodos([data as Todo, ...todos]);
        setExpandedTodos(prev => new Set(prev).add(selectedParentTask.id));
        toast({
          title: "Subtask added",
          description: `"${data.text}" has been added as a subtask.`,
        });
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
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

  const updatePriority = async (id: string, priority: string) => {
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

  const toggleExpand = (id: string) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Sort hierarchical todos by priority order, then by completion status
  const hierarchicalTodos = organizeHierarchicalTodos();
  const sortedHierarchicalTodos = [...hierarchicalTodos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const priorityA = priorities.find(p => p.name === a.priority);
    const priorityB = priorities.find(p => p.name === b.priority);
    
    const sortOrderA = priorityA?.sort_order ?? 999;
    const sortOrderB = priorityB?.sort_order ?? 999;
    
    if (sortOrderA !== sortOrderB) {
      return sortOrderA - sortOrderB;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredHierarchicalTodos = hideCompleted 
    ? sortedHierarchicalTodos.filter(todo => !todo.completed) 
    : sortedHierarchicalTodos;

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
            onChange={(e) => setNewPriority(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.name} className="capitalize">
                {priority.name}
              </option>
            ))}
          </select>
          <Button onClick={() => addTodo()} className="flex-shrink-0">
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
        <SortableContext items={filteredHierarchicalTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {filteredHierarchicalTodos.map((todo) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onPriorityChange={updatePriority}
                onAddSubtask={openSubtaskModal}
                onToggleExpand={toggleExpand}
                priorities={priorities}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredHierarchicalTodos.length === 0 && todos.length > 0 && (
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

      <AddSubtaskModal
        isOpen={subtaskModalOpen}
        onClose={() => setSubtaskModalOpen(false)}
        onAdd={addSubtask}
        priorities={priorities}
        parentTaskText={selectedParentTask?.text || ""}
      />
    </div>
  );
}