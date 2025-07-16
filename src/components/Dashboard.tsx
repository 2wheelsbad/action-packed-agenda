
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, FileText, Target } from "lucide-react";
import { format } from "date-fns";

export function Dashboard() {
  const stats = [
    {
      title: "Active Tasks",
      value: "8",
      change: "+2",
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Today",
      value: "5",
      change: "+3",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming Events",
      value: "3",
      change: "0",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Notes Created",
      value: "12",
      change: "+1",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];


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
        {stats.map((stat) => (
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
              <span>5/8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: "62.5%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Focus Time</span>
              <span>4h 30m / 6h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
