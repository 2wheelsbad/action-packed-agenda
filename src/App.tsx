
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Home, CheckSquare, Clock, Calendar, FileText, Zap } from "lucide-react";
import { CyberTerminal } from "@/components/CyberTerminal";
import DashboardPage from "./pages/DashboardPage";
import TodosPage from "./pages/TodosPage";
import TimeLogPage from "./pages/TimeLogPage";
import CalendarPage from "./pages/CalendarPage";
import NotesPage from "./pages/NotesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full scanlines relative">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-16 terminal-border bg-black/90 backdrop-blur-sm flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary neon-glow" />
                    <h1 className="text-xl font-bold font-mono neon-glow">CYBER_PRODUCTIVE</h1>
                  </div>
                </div>
                
                {/* Main Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                  <NavLink to="/">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className={`gap-2 font-mono terminal-border ${isActive ? 'neon-glow' : 'hover:neon-glow'}`}
                      >
                        <Home className="w-4 h-4" />
                        DASH
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/todos">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className={`gap-2 font-mono terminal-border ${isActive ? 'neon-glow' : 'hover:neon-glow'}`}
                      >
                        <CheckSquare className="w-4 h-4" />
                        TASKS
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/timelog">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className={`gap-2 font-mono terminal-border ${isActive ? 'neon-glow' : 'hover:neon-glow'}`}
                      >
                        <Clock className="w-4 h-4" />
                        TIME
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/calendar">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className={`gap-2 font-mono terminal-border ${isActive ? 'neon-glow' : 'hover:neon-glow'}`}
                      >
                        <Calendar className="w-4 h-4" />
                        CALENDAR
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/notes">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className={`gap-2 font-mono terminal-border ${isActive ? 'neon-glow' : 'hover:neon-glow'}`}
                      >
                        <FileText className="w-4 h-4" />
                        NOTES
                      </Button>
                    )}
                  </NavLink>
                </nav>
              </header>
              <main className="flex-1 overflow-auto bg-black/20">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/todos" element={<TodosPage />} />
                  <Route path="/timelog" element={<TimeLogPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <CyberTerminal />
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
