
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, FileText, Target } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface DashboardStats {
  activeTasks: number;
  completedToday: number;
  upcomingEvents: number;
  notesCreated: number;
  completionRate: number;
  focusTimePercentage: number;
  focusTimeActual: string;
  focusTimeTarget: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTasks: 0,
    completedToday: 0,
    upcomingEvents: 0,
    notesCreated: 0,
    completionRate: 0,
    focusTimePercentage: 0,
    focusTimeActual: "0h 0m",
    focusTimeTarget: "6h",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch todos
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);

      // Fetch calendar events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today);

      // Fetch notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

      // Fetch time logs for today
      const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      if (todos && events && notes && timeLogs) {
        const activeTasks = todos.filter(todo => !todo.completed).length;
        const completedToday = todos.filter(todo => 
          todo.completed && 
          new Date(todo.updated_at).toDateString() === new Date().toDateString()
        ).length;
        const upcomingEvents = events.length;
        const notesCreated = notes.length;
        
        const totalTasks = todos.length;
        const completionRate = totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0;
        
        const totalFocusMinutes = timeLogs.reduce((sum, log) => sum + log.duration, 0);
        const focusTimeHours = Math.floor(totalFocusMinutes / 60);
        const focusTimeMinutes = totalFocusMinutes % 60;
        const focusTimeActual = `${focusTimeHours}h ${focusTimeMinutes}m`;
        const focusTimeTarget = "6h";
        const focusTimePercentage = Math.min((totalFocusMinutes / 360) * 100, 100); // 360 minutes = 6 hours

        setStats({
          activeTasks,
          completedToday,
          upcomingEvents,
          notesCreated,
          completionRate,
          focusTimePercentage,
          focusTimeActual,
          focusTimeTarget,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dashboardStats = [
    {
      title: "Active Tasks",
      value: stats.activeTasks.toString(),
      change: "+0",
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Today",
      value: stats.completedToday.toString(),
      change: "+0",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents.toString(),
      change: "+0",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Notes Created",
      value: stats.notesCreated.toString(),
      change: "+0",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"}>
                {stat.change}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>


      {/* Progress Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Tasks Completed</span>
              <span>{stats.completedToday}/{stats.activeTasks + stats.completedToday}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${stats.completionRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Focus Time</span>
              <span>{stats.focusTimeActual} / {stats.focusTimeTarget}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${stats.focusTimePercentage}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
