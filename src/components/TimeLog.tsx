import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Clock, Trash2, Edit3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  activity: string;
  duration: number; // in minutes
  date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function TimeLog() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editActivity, setEditActivity] = useState("");
  const [editDuration, setEditDuration] = useState("");

  // Fetch time logs from database
  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching time logs",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching time logs:', error);
      toast({
        title: "Error fetching time logs",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Add new time entry
  const addTimeEntry = async () => {
    if (!newActivity.trim() || !newDuration.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both activity and duration.",
        variant: "destructive"
      });
      return;
    }

    const duration = parseInt(newDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add time logs",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          activity: newActivity.trim(),
          duration: duration,
          date: new Date().toISOString().split('T')[0],
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error adding time log",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEntries([data, ...entries]);
        setNewActivity("");
        setNewDuration("");
        toast({
          title: "Time log added",
          description: `"${data.activity}" - ${formatDuration(data.duration)}`,
        });
      }
    } catch (error) {
      console.error('Error adding time log:', error);
      toast({
        title: "Error adding time log",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Edit time entry
  const updateTimeEntry = async () => {
    if (!editingEntry || !editActivity.trim() || !editDuration.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both activity and duration.",
        variant: "destructive"
      });
      return;
    }

    const duration = parseInt(editDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({
          activity: editActivity.trim(),
          duration: duration
        })
        .eq('id', editingEntry.id);

      if (error) {
        toast({
          title: "Error updating time log",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEntries(entries.map(entry => 
          entry.id === editingEntry.id 
            ? { ...entry, activity: editActivity.trim(), duration: duration }
            : entry
        ));
        setEditingEntry(null);
        setEditActivity("");
        setEditDuration("");
        toast({
          title: "Time log updated",
          description: "Your time log has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating time log:', error);
      toast({
        title: "Error updating time log",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Delete time entry
  const deleteEntry = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting time log",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEntries(entries.filter(entry => entry.id !== id));
        toast({
          title: "Time log deleted",
          description: `"${entry.activity}" has been removed.`,
        });
      }
    } catch (error) {
      console.error('Error deleting time log:', error);
      toast({
        title: "Error deleting time log",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Start editing
  const startEditing = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditActivity(entry.activity);
    setEditDuration(entry.duration.toString());
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingEntry(null);
    setEditActivity("");
    setEditDuration("");
  };

  // Calculate total time
  const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);

  // Get today's entries
  const todayEntries = entries.filter(entry => {
    const today = new Date().toISOString().split('T')[0];
    return entry.date === today;
  });

  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Log</h1>
            <p className="text-muted-foreground">Loading time logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Clock className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Log</h1>
          <p className="text-muted-foreground">Track your time and stay productive</p>
        </div>
      </div>

      {/* Add Time Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Time Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="What did you work on?"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className="md:col-span-2"
            />
            <Input
              placeholder="Duration (minutes)"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              type="number"
              min="1"
            />
          </div>
          <Button onClick={addTimeEntry} className="w-full">
            Add Time Entry
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Total</p>
                <p className="text-2xl font-bold">{formatDuration(todayTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">All Time Total</p>
                <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No time entries yet. Add your first time entry!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    {editingEntry?.id === entry.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editActivity}
                          onChange={(e) => setEditActivity(e.target.value)}
                          className="font-medium"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            type="number"
                            min="1"
                            className="w-32"
                          />
                          <Button size="sm" onClick={updateTimeEntry}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium">{entry.activity}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                          <span>Duration: {formatDuration(entry.duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {editingEntry?.id !== entry.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(entry)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}