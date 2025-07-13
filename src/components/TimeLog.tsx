import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Clock, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isActive: boolean;
}

export function TimeLog() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  // Round to nearest 15 minutes
  const roundToNearestQuarter = (minutes: number): number => {
    return Math.round(minutes / 15) * 15;
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate current active duration
  const getCurrentDuration = (): number => {
    if (!activeEntry) return 0;
    return Math.floor((currentTime.getTime() - activeEntry.startTime.getTime()) / (1000 * 60));
  };

  // Start timer
  const startTimer = () => {
    if (!currentTask.trim()) {
      toast({
        title: "Task Required",
        description: "Please enter a task name before starting the timer.",
        variant: "destructive"
      });
      return;
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      taskName: currentTask.trim(),
      startTime: new Date(),
      duration: 0,
      isActive: true
    };

    setActiveEntry(newEntry);
    setEntries(prev => [newEntry, ...prev]);
    toast({
      title: "Timer Started",
      description: `Started tracking "${currentTask}"`,
    });
  };

  // Stop timer
  const stopTimer = () => {
    if (!activeEntry) return;

    const endTime = new Date();
    const rawDuration = Math.floor((endTime.getTime() - activeEntry.startTime.getTime()) / (1000 * 60));
    const roundedDuration = roundToNearestQuarter(rawDuration);

    const completedEntry: TimeEntry = {
      ...activeEntry,
      endTime,
      duration: roundedDuration,
      isActive: false
    };

    setEntries(prev => prev.map(entry => 
      entry.id === activeEntry.id ? completedEntry : entry
    ));

    setActiveEntry(null);
    setCurrentTask("");
    
    toast({
      title: "Timer Stopped",
      description: `Logged ${formatDuration(roundedDuration)} for "${activeEntry.taskName}"`,
    });
  };

  // Delete entry
  const deleteEntry = (id: string) => {
    if (activeEntry?.id === id) {
      setActiveEntry(null);
      setCurrentTask("");
    }
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Entry Deleted",
      description: "Time entry has been removed.",
    });
  };

  // Calculate total time
  const totalTime = entries
    .filter(entry => !entry.isActive)
    .reduce((sum, entry) => sum + entry.duration, 0);

  // Get today's entries
  const todayEntries = entries.filter(entry => {
    const today = new Date();
    const entryDate = entry.startTime;
    return entryDate.toDateString() === today.toDateString();
  });

  const todayTotal = todayEntries
    .filter(entry => !entry.isActive)
    .reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Clock className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Log</h1>
          <p className="text-muted-foreground">Track your time and stay productive</p>
        </div>
      </div>

      {/* Timer Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="What are you working on?"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              disabled={!!activeEntry}
              className="flex-1"
            />
            {activeEntry ? (
              <Button onClick={stopTimer} variant="destructive" className="gap-2">
                <Pause className="w-4 h-4" />
                Stop ({formatDuration(getCurrentDuration())})
              </Button>
            ) : (
              <Button onClick={startTimer} className="gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            )}
          </div>

          {activeEntry && (
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{activeEntry.taskName}</p>
                  <p className="text-sm text-muted-foreground">
                    Started at {activeEntry.startTime.toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {formatDuration(getCurrentDuration())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (rounds to {formatDuration(roundToNearestQuarter(getCurrentDuration()))})
                  </p>
                </div>
              </div>
            </div>
          )}
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
              <p>No time entries yet. Start tracking your first task!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.isActive 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-card hover:bg-accent/50 transition-colors"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{entry.taskName}</h3>
                      {entry.isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        {entry.startTime.toLocaleString()}
                      </span>
                      {entry.endTime && (
                        <span>→ {entry.endTime.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {entry.isActive 
                          ? formatDuration(getCurrentDuration())
                          : formatDuration(entry.duration)
                        }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}