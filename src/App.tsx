
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Home, CheckSquare, Clock, Calendar, FileText } from "lucide-react";
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
          <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-productive-50">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <h1 className="text-xl font-bold text-primary">ProductiveMe</h1>
                </div>
                
                {/* Main Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                  <NavLink to="/">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Dashboard
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/todos">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Todos
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/timelog">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Time Log
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/calendar">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Calendar
                      </Button>
                    )}
                  </NavLink>
                  <NavLink to="/notes">
                    {({ isActive }) => (
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Notes
                      </Button>
                    )}
                  </NavLink>
                </nav>
              </header>
              <main className="flex-1 overflow-auto">
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
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
