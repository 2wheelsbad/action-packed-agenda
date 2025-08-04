import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Play, Pause, Clock, Trash2, Edit3, CalendarIcon, X, Calendar as CalendarViewIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Fetch time logs from database
  useEffect(() => {
    fetchTimeEntries();
  }, [selectedDate, viewMode]);

  const fetchTimeEntries = async () => {
    try {
      let query = supabase
        .from('time_logs')
        .select('*');

      // Filter by selected date or week if specified
      if (selectedDate) {
        if (viewMode === 'day') {
          const dateStr = selectedDate.toISOString().split('T')[0];
          query = query.eq('date', dateStr);
        } else {
          // Week view - get all entries for the week
          const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
          const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
          const startStr = weekStart.toISOString().split('T')[0];
          const endStr = weekEnd.toISOString().split('T')[0];
          query = query.gte('date', startStr).lte('date', endStr);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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

  // Get filtered date label
  const getDateLabel = () => {
    if (!selectedDate) return "All Time";
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'MMM d, yyyy');
  };

  // Group entries by date for week view
  const getGroupedEntries = () => {
    if (viewMode === 'day') return { [selectedDate?.toISOString().split('T')[0] || '']: entries };
    
    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const grouped: Record<string, TimeEntry[]> = {};
    
    weekDays.forEach(day => {
      const dayStr = day.toISOString().split('T')[0];
      grouped[dayStr] = entries.filter(entry => entry.date === dayStr);
    });
    
    return grouped;
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Log</h1>
            <p className="text-muted-foreground">Track your time and stay productive</p>
          </div>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-r-none"
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-l-none"
            >
              Week
            </Button>
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="text-muted-foreground hover:text-foreground"
          >
            Today
          </Button>
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
                <p className="text-sm text-muted-foreground">{getDateLabel()}</p>
                <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
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
                <p className="text-sm text-muted-foreground">Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
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
          ) : viewMode === 'week' ? (
            <div className="space-y-6">
              {Object.entries(getGroupedEntries()).map(([date, dayEntries]) => {
                const dayDate = new Date(date + 'T00:00:00');
                const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
                
                return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="font-semibold text-lg">
                        {format(dayDate, 'EEEE, MMM d')}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {dayEntries.length} entries • {formatDuration(dayTotal)}
                      </div>
                    </div>
                    
                    {dayEntries.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">No entries for this day</p>
                    ) : (
                      <div className="space-y-2">
                        {dayEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
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
                                  <h4 className="font-medium">{entry.activity}</h4>
                                  <div className="text-sm text-muted-foreground">
                                    Duration: {formatDuration(entry.duration)}
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
                  </div>
                );
              })}
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