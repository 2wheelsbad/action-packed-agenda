
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Home, CheckSquare, Clock, Calendar, FileText, Zap, LogOut } from "lucide-react";
import { CyberTerminal } from "@/components/CyberTerminal";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import DashboardPage from "./pages/DashboardPage";
import TodosPage from "./pages/TodosPage";
import TimeLogPage from "./pages/TimeLogPage";
import CalendarPage from "./pages/CalendarPage";
import NotesPage from "./pages/NotesPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddNote = (title: string, content: string, tags: string[]) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black/20 scanlines flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary neon-glow animate-pulse mx-auto mb-4" />
          <p className="text-lg font-mono neon-glow">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!user ? (
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          ) : (
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
                      
                      <Button 
                        onClick={handleLogout}
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 font-mono terminal-border hover:neon-glow ml-2"
                      >
                        <LogOut className="w-4 h-4" />
                        LOGOUT
                      </Button>
                    </nav>
                  </header>
                  <main className="flex-1 overflow-auto bg-black/20">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/todos" element={<TodosPage />} />
                      <Route path="/timelog" element={<TimeLogPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/notes" element={<NotesPage />} />
                      <Route path="/auth" element={<Navigate to="/" replace />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
                <CyberTerminal onAddNote={handleAddNote} />
              </div>
            </SidebarProvider>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
