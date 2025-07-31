import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Minimize2, Maximize2, X, Expand } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Command {
  input: string;
  output: string[];
  timestamp: Date;
  type: 'success' | 'error' | 'info';
}

interface CyberTerminalProps {
  onAddTodo?: (text: string, priority: 'low' | 'medium' | 'high') => void;
  onAddTimeLog?: (activity: string, duration: number) => void;
  onAddCalendarEvent?: (title: string, date: Date) => void;
  onAddNote?: (title: string, content: string, tags: string[]) => void;
  embedded?: boolean;
}

export function CyberTerminal({ onAddTodo, onAddTimeLog, onAddCalendarEvent, onAddNote, embedded = false }: CyberTerminalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(embedded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([
    {
      input: "system.boot()",
      output: [
        ">>> CYBERPUNK PRODUCTIVITY TERMINAL v3.0 <<<",
        ">>> Enhanced neural interface loaded...",
        ">>> Smart time tracking initialized...",
        ">>> Database connection established",
        ">>> Type 'help' for available commands",
      ],
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [activeTimeLog, setActiveTimeLog] = useState<{activity: string, startTime: number} | null>(null);
  const [currentTheme, setCurrentTheme] = useState('purple');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Load active time log from localStorage on mount
  useEffect(() => {
    const savedTimeLog = localStorage.getItem('activeTimeLog');
    if (savedTimeLog) {
      setActiveTimeLog(JSON.parse(savedTimeLog));
    }
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cyberTerminalTheme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      // Apply theme classes properly
      const documentElement = document.documentElement;
      documentElement.classList.remove('theme-green', 'theme-purple', 'theme-red', 'theme-black', 'dark');
      documentElement.classList.add(`theme-${savedTheme}`);
    } else {
      setCurrentTheme('purple');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('theme-purple');
    }
  }, []);

  // Save active time log to localStorage when it changes
  useEffect(() => {
    if (activeTimeLog) {
      localStorage.setItem('activeTimeLog', JSON.stringify(activeTimeLog));
    } else {
      localStorage.removeItem('activeTimeLog');
    }
  }, [activeTimeLog]);

  // Save and apply theme when it changes
  useEffect(() => {
    localStorage.setItem('cyberTerminalTheme', currentTheme);
    
    // Remove existing theme classes and add new one
    const documentElement = document.documentElement;
    documentElement.classList.remove('theme-green', 'theme-purple', 'theme-red', 'theme-black', 'dark');
    
    // Force a small delay to ensure class removal is processed
    setTimeout(() => {
      documentElement.classList.add(`theme-${currentTheme}`);
    }, 10);
  }, [currentTheme]);

  useEffect(() => {
    if ((isOpen || embedded) && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized, embedded]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  // Helper function to parse arguments with support for short flags
  const parseArgs = (args: string[]) => {
    const parsed: {[key: string]: string} = {};
    const positional: string[] = [];
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const [key, value] = arg.split('=');
        parsed[key] = value || args[i + 1];
        if (!value) i++; // Skip next arg if it was used as value
      } else if (arg.startsWith('-') && arg.length > 1) {
        // Short flag mapping
        const shortFlag = arg.substring(1);
        const flagMap: {[key: string]: string} = {
          'p': 'priority',
          'd': 'date',
          't': 'tags',
          'h': 'help',
          'f': 'format'
        };
        const fullFlag = flagMap[shortFlag];
        if (fullFlag) {
          parsed[`--${fullFlag}`] = args[i + 1];
          i++; // Skip next arg
        }
      } else {
        positional.push(arg);
      }
    }
    
    return { parsed, positional };
  };

  // Helper function to get current page name
  const getCurrentPageName = () => {
    const path = location.pathname;
    const pathMap: {[key: string]: string} = {
      '/': 'dashboard',
      '/dashboard': 'dashboard',
      '/todos': 'todos',
      '/timelog': 'timelog',
      '/calendar': 'calendar',
      '/notes': 'notes'
    };
    return pathMap[path] || 'unknown';
  };

  const executeCommand = async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    const args = trimmedInput.split(' ');
    const command = args[0].toLowerCase();
    const { parsed, positional } = parseArgs(args.slice(1));
    
    let output: string[] = [];
    let type: 'success' | 'error' | 'info' = 'info';

    try {
      switch (command) {
        case 'help':
          if (positional.length > 0) {
            const helpCommand = positional[0];
            const helpTexts: {[key: string]: string[]} = {
              'todo.add': [
                "todo.add <task> [-p|--priority=low|medium|high]",
                "Add a new todo item",
                "Examples:",
                "• todo.add 'Complete project' -p high",
                "• todo.add 'Review code' --priority=medium"
              ],
              'todo.list': [
                "todo.list [-p|--priority=low|medium|high]",
                "List todos, optionally filtered by priority",
                "Examples:",
                "• todo.list",
                "• todo.list -p high"
              ],
              'time.start': [
                "time.start <activity>",
                "Start time tracking for an activity",
                "Auto-stops previous activity if running",
                "Examples:",
                "• time.start 'Deep work session'",
                "• time.start 'Meeting with team'"
              ],
              'nav.dash': [
                "nav.dash | goto.dashboard",
                "Navigate to dashboard page",
                "Examples:",
                "• nav.dash",
                "• goto.dashboard"
              ]
            };
            output = helpTexts[helpCommand] || [`No help available for '${helpCommand}'`];
          } else {
            output = [
              "ENHANCED TERMINAL COMMANDS v3.0:",
              "",
              "📍 NAVIGATION:",
              "├── nav.dash, goto.dashboard - Dashboard",
              "├── nav.todos, goto.tasks - Todo list",
              "├── nav.time, goto.timelog - Time tracking",
              "├── nav.calendar, goto.calendar - Calendar",
              "├── nav.notes, goto.notes - Notes",
              "└── nav.back - Go back",
              "",
              "✅ TODO MANAGEMENT:",
              "├── todo.add <task> [-p high|medium|low]",
              "├── todo.list [-p priority]",
              "├── todo.complete <id>",
              "├── todo.delete <id>",
              "└── todo.priority <id> -p <priority>",
              "",
              "⏱️ TIME TRACKING:",
              "├── time.start <activity> - Start tracking",
              "├── time.stop - Stop current session",
              "├── time.status - Show active session",
              "├── time.log <activity> <minutes> - Manual entry",
              "└── time.today - Today's summary",
              "",
              "📅 CALENDAR & NOTES:",
              "├── cal.add <event> [-d YYYY-MM-DD]",
              "├── cal.today - Today's events",
              "├── note.add <title> <content> [-t tags]",
              "└── note.search <keyword>",
              "",
              "🔧 SYSTEM:",
              "├── sys.status - System information",
              "├── theme.change -[green/purple/red/black]",
              "├── history - Command history",
              "├── clear - Clear terminal",
              "└── help <command> - Detailed help",
              "",
              "💡 Use 'help <command>' for detailed usage"
            ];
          }
          type = 'success';
          break;

        // Navigation Commands
        case 'nav.dash':
        case 'goto.dashboard':
          setNavigationHistory(prev => [...prev, location.pathname]);
          navigate('/dashboard');
          output = ["[✓] Navigated to dashboard"];
          type = 'success';
          break;

        case 'nav.todos':
        case 'goto.tasks':
          setNavigationHistory(prev => [...prev, location.pathname]);
          navigate('/todos');
          output = ["[✓] Navigated to todos"];
          type = 'success';
          break;

        case 'nav.time':
        case 'goto.timelog':
          setNavigationHistory(prev => [...prev, location.pathname]);
          navigate('/timelog');
          output = ["[✓] Navigated to time log"];
          type = 'success';
          break;

        case 'nav.calendar':
        case 'goto.calendar':
          setNavigationHistory(prev => [...prev, location.pathname]);
          navigate('/calendar');
          output = ["[✓] Navigated to calendar"];
          type = 'success';
          break;

        case 'nav.notes':
        case 'goto.notes':
          setNavigationHistory(prev => [...prev, location.pathname]);
          navigate('/notes');
          output = ["[✓] Navigated to notes"];
          type = 'success';
          break;

        case 'nav.back':
          if (navigationHistory.length > 0) {
            const lastPath = navigationHistory[navigationHistory.length - 1];
            setNavigationHistory(prev => prev.slice(0, -1));
            navigate(lastPath);
            output = [`[✓] Navigated back to ${lastPath}`];
            type = 'success';
          } else {
            output = ["No navigation history available"];
            type = 'error';
          }
          break;

        case 'nav.refresh':
          window.location.reload();
          return;

        // Enhanced Todo Management
        case 'todo.add':
          if (positional.length < 1) {
            output = ["ERROR: Task description required"];
            type = 'error';
          } else {
            const priority = (parsed['--priority'] || parsed['-p'] || 'medium') as 'low' | 'medium' | 'high';
            const taskText = positional.join(' ').replace(/['"]/g, '');
            
            if (['low', 'medium', 'high'].includes(priority)) {
              onAddTodo?.(taskText, priority);
              output = [`[✓] Task added: "${taskText}" (priority: ${priority})`];
              type = 'success';
              toast({
                title: "Task added via terminal",
                description: taskText,
              });
            } else {
              output = ["ERROR: Invalid priority. Use low, medium, or high"];
              type = 'error';
            }
          }
          break;

        case 'todo.list':
          try {
            const priorityFilter = parsed['--priority'] || parsed['-p'];
            let query = supabase.from('todos').select('*').order('created_at', { ascending: false });
            
            if (priorityFilter) {
              query = query.eq('priority', priorityFilter);
            }
            
            const { data: todos, error } = await query;
            
            if (error) {
              output = [`ERROR: ${error.message}`];
              type = 'error';
            } else {
              if (todos?.length === 0) {
                output = ["No todos found"];
                type = 'info';
              } else {
                output = [
                  `Found ${todos?.length} todo(s):`,
                  ""
                ];
                todos?.forEach((todo, index) => {
                  const status = todo.completed ? '✅' : '⏳';
                  const priority = todo.priority.toUpperCase();
                  const shortId = todo.id.substring(0, 8);
                  output.push(`${index + 1}. ${status} [${priority}] ${todo.text} (ID: ${shortId})`);
                });
                type = 'success';
              }
            }
          } catch (error) {
            output = ["ERROR: Failed to fetch todos"];
            type = 'error';
          }
          break;

        case 'todo.complete':
          if (positional.length < 1) {
            output = ["ERROR: Todo ID required"];
            type = 'error';
          } else {
            const todoId = positional[0];
            try {
              const { error } = await supabase
                .from('todos')
                .update({ completed: true })
                .eq('id', todoId);
              
              if (error) {
                output = [`ERROR: ${error.message}`];
                type = 'error';
              } else {
                output = [`[✓] Todo ${todoId.substring(0, 8)} marked as completed`];
                type = 'success';
                toast({
                  title: "Todo completed",
                  description: "Task marked as completed via terminal",
                });
              }
            } catch (error) {
              output = ["ERROR: Failed to complete todo"];
              type = 'error';
            }
          }
          break;

        case 'todo.delete':
          if (positional.length < 1) {
            output = ["ERROR: Todo ID required"];
            type = 'error';
          } else {
            const todoId = positional[0];
            try {
              const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', todoId);
              
              if (error) {
                output = [`ERROR: ${error.message}`];
                type = 'error';
              } else {
                output = [`[✓] Todo ${todoId.substring(0, 8)} deleted`];
                type = 'success';
                toast({
                  title: "Todo deleted",
                  description: "Task deleted via terminal",
                });
              }
            } catch (error) {
              output = ["ERROR: Failed to delete todo"];
              type = 'error';
            }
          }
          break;

        // Smart Time Tracking
        case 'time.start':
          if (positional.length < 1) {
            output = ["ERROR: Activity name required"];
            type = 'error';
          } else {
            const activity = positional.join(' ').replace(/['"]/g, '');
            
            // Stop previous activity if running
            if (activeTimeLog) {
              const duration = Math.round((Date.now() - activeTimeLog.startTime) / 60000);
              await onAddTimeLog?.(activeTimeLog.activity, duration);
              output = [`[✓] Stopped: "${activeTimeLog.activity}" (${duration} minutes)`];
            }
            
            // Start new activity
            setActiveTimeLog({ activity, startTime: Date.now() });
            output = [...output, `[✓] Started tracking: "${activity}"`];
            type = 'success';
            toast({
              title: "Time tracking started",
              description: activity,
            });
          }
          break;

        case 'time.stop':
          if (!activeTimeLog) {
            output = ["No active time tracking session"];
            type = 'error';
          } else {
            const duration = Math.round((Date.now() - activeTimeLog.startTime) / 60000);
            await onAddTimeLog?.(activeTimeLog.activity, duration);
            output = [`[✓] Stopped: "${activeTimeLog.activity}" (${duration} minutes)`];
            setActiveTimeLog(null);
            type = 'success';
            toast({
              title: "Time tracking stopped",
              description: `${activeTimeLog.activity} - ${duration}m`,
            });
          }
          break;

        case 'time.status':
          if (!activeTimeLog) {
            output = ["No active time tracking session"];
            type = 'info';
          } else {
            const elapsed = Math.round((Date.now() - activeTimeLog.startTime) / 60000);
            output = [
              "ACTIVE TIME TRACKING:",
              `├── Activity: ${activeTimeLog.activity}`,
              `├── Started: ${format(new Date(activeTimeLog.startTime), 'HH:mm:ss')}`,
              `└── Elapsed: ${elapsed} minutes`
            ];
            type = 'success';
          }
          break;

        case 'time.log':
          if (positional.length < 2) {
            output = ["ERROR: Usage: time.log <activity> <duration_minutes>"];
            type = 'error';
          } else {
            const duration = parseInt(positional[positional.length - 1]);
            const activity = positional.slice(0, -1).join(' ').replace(/['"]/g, '');
            
            if (isNaN(duration)) {
              output = ["ERROR: Duration must be a number"];
              type = 'error';
            } else {
              onAddTimeLog?.(activity, duration);
              output = [`[✓] Time logged: "${activity}" - ${duration} minutes`];
              type = 'success';
              toast({
                title: "Time logged via terminal",
                description: `${activity} - ${duration}m`,
              });
            }
          }
          break;

        case 'time.today':
          try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: logs, error } = await supabase
              .from('time_logs')
              .select('*')
              .eq('date', today)
              .order('created_at', { ascending: false });
            
            if (error) {
              output = [`ERROR: ${error.message}`];
              type = 'error';
            } else {
              const totalTime = logs?.reduce((sum, log) => sum + log.duration, 0) || 0;
              output = [
                `TODAY'S TIME SUMMARY (${today}):`,
                `├── Total time: ${totalTime} minutes (${Math.round(totalTime/60*10)/10}h)`,
                `├── Sessions: ${logs?.length || 0}`,
                ""
              ];
              
              if (logs?.length) {
                output.push("Recent sessions:");
                logs.slice(0, 5).forEach((log, index) => {
                  output.push(`${index + 1}. ${log.activity} - ${log.duration}m`);
                });
              }
              type = 'success';
            }
          } catch (error) {
            output = ["ERROR: Failed to fetch time logs"];
            type = 'error';
          }
          break;

        // Enhanced Calendar Commands
        case 'cal.add':
          if (positional.length < 1) {
            output = ["ERROR: Event title required"];
            type = 'error';
          } else {
            const dateStr = parsed['--date'] || parsed['-d'];
            const date = dateStr ? new Date(dateStr) : new Date();
            const title = positional.join(' ').replace(/['"]/g, '');
            
            if (dateStr && isNaN(date.getTime())) {
              output = ["ERROR: Invalid date format. Use YYYY-MM-DD"];
              type = 'error';
            } else {
              onAddCalendarEvent?.(title, date);
              output = [`[✓] Event added: "${title}" on ${format(date, 'yyyy-MM-dd')}`];
              type = 'success';
              toast({
                title: "Calendar event added via terminal",
                description: title,
              });
            }
          }
          break;

        case 'cal.today':
          try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: events, error } = await supabase
              .from('calendar_events')
              .select('*')
              .eq('date', today)
              .order('created_at', { ascending: false });
            
            if (error) {
              output = [`ERROR: ${error.message}`];
              type = 'error';
            } else {
              output = [
                `TODAY'S EVENTS (${today}):`,
                ""
              ];
              
              if (events?.length === 0) {
                output.push("No events scheduled for today");
              } else {
                events?.forEach((event, index) => {
                  output.push(`${index + 1}. ${event.title} (${event.type})`);
                });
              }
              type = 'success';
            }
          } catch (error) {
            output = ["ERROR: Failed to fetch calendar events"];
            type = 'error';
          }
          break;

        // Enhanced Notes Commands
        case 'note.add':
          if (positional.length < 2) {
            output = ["ERROR: Usage: note.add <title> <content> [-t tag1,tag2]"];
            type = 'error';
          } else {
            const tagsStr = parsed['--tags'] || parsed['-t'];
            const tags = tagsStr ? tagsStr.split(',').map(tag => tag.trim()) : [];
            const title = positional[0].replace(/['"]/g, '');
            const content = positional.slice(1).join(' ').replace(/['"]/g, '');
            
            onAddNote?.(title, content, tags);
            output = [`[✓] Note created: "${title}"`];
            if (tags.length > 0) {
              output.push(`    Tags: ${tags.join(', ')}`);
            }
            type = 'success';
            toast({
              title: "Note added via terminal",
              description: title,
            });
          }
          break;

        case 'note.search':
          if (positional.length < 1) {
            output = ["ERROR: Search keyword required"];
            type = 'error';
          } else {
            const keyword = positional.join(' ');
            try {
              const { data: notes, error } = await supabase
                .from('notes')
                .select('*')
                .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
                .order('created_at', { ascending: false });
              
              if (error) {
                output = [`ERROR: ${error.message}`];
                type = 'error';
              } else {
                output = [
                  `Found ${notes?.length || 0} note(s) matching "${keyword}":`,
                  ""
                ];
                
                notes?.forEach((note, index) => {
                  const shortId = note.id.substring(0, 8);
                  output.push(`${index + 1}. ${note.title} (ID: ${shortId})`);
                  if (note.tags?.length) {
                    output.push(`    Tags: ${note.tags.join(', ')}`);
                  }
                });
                type = 'success';
              }
            } catch (error) {
              output = ["ERROR: Failed to search notes"];
              type = 'error';
            }
          }
          break;

        // System Commands
        case 'sys.status': {
          const currentPage = getCurrentPageName();
          output = [
            "SYSTEM STATUS:",
            "├── Neural Interface: ONLINE",
            "├── Productivity Matrix: ACTIVE",
            "├── Database: CONNECTED",
            `├── Current Location: ${currentPage}`,
            `├── Active Time Log: ${activeTimeLog ? activeTimeLog.activity : 'None'}`,
            `├── Memory Usage: ${Math.round(Math.random() * 100)}%`,
            "└── Threat Level: MINIMAL",
            "",
            `Current Time: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
          ];
          type = 'success';
          break;
        }

        case 'history':
          output = [
            "COMMAND HISTORY:",
            ""
          ];
          commandHistory.slice(-10).forEach((cmd, index) => {
            output.push(`${commandHistory.length - 10 + index + 1}. ${cmd}`);
          });
          type = 'success';
          break;

        case 'data.refresh':
          window.location.reload();
          return;

        case 'clear':
          setCommands([]);
          setCurrentInput("");
          return;

        case 'theme.change':
          if (positional.length < 1) {
            output = [
              "ERROR: Theme required. Usage: theme.change -[green/purple/red/black]",
              "",
              "Available themes:",
              "├── green - Matrix-style green theme",
              "├── purple - Cyberpunk purple theme (default)",
              "├── red - Alert red theme",
              "└── black - Monochrome black/white theme"
            ];
            type = 'error';
          } else {
            const themeArg = positional[0];
            const theme = themeArg.startsWith('-') ? themeArg.substring(1) : themeArg;
            const validThemes = ['green', 'purple', 'red', 'black'];
            
            if (validThemes.includes(theme)) {
              setCurrentTheme(theme);
              
              // Force immediate application and style recalculation
              const documentElement = document.documentElement;
               documentElement.classList.remove('theme-green', 'theme-purple', 'theme-red', 'theme-black', 'dark');
               documentElement.classList.add(`theme-${theme}`);
              
              // Force browser to recalculate styles
              documentElement.style.setProperty('--force-recalc', Math.random().toString());
              setTimeout(() => {
                documentElement.style.removeProperty('--force-recalc');
              }, 0);
              
              output = [
                `[✓] Theme changed to ${theme.toUpperCase()}`,
                `Color scheme updated successfully`,
                `Theme persisted to local storage`
              ];
              type = 'success';
              toast({
                title: "Theme Changed",
                description: `Switched to ${theme} theme`,
              });
            } else {
              output = [
                `ERROR: Invalid theme '${theme}'`,
                "Available themes: green, purple, red, black"
              ];
              type = 'error';
            }
          }
          break;

        case 'hack.time':
          output = [
            `> Accessing temporal matrix...`,
            `> Current timestamp: ${Date.now()}`,
            `> Local time: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
            `> Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
            `> Active session: ${activeTimeLog ? activeTimeLog.activity : 'None'}`,
          ];
          type = 'success';
          break;

        default:
          output = [
            `Command '${command}' not recognized.`,
            "Type 'help' for available commands.",
            "Use 'help <command>' for detailed usage."
          ];
          type = 'error';
      }
    } catch (error) {
      output = [
        `ERROR: Command execution failed`,
        `Details: ${error instanceof Error ? error.message : 'Unknown error'}`
      ];
      type = 'error';
    }

    const newCommand: Command = {
      input: trimmedInput,
      output,
      timestamp: new Date(),
      type
    };

    setCommands(prev => [...prev, newCommand]);
    setCurrentInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  if (!isOpen && !embedded) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 cyber-card z-50"
        size="lg"
      >
        <Terminal className="w-5 h-5 mr-2" />
        HACK TERMINAL
      </Button>
    );
  }

  const getContainerClass = () => {
    if (embedded) {
      return "w-full h-full cyber-card scanlines flex flex-col";
    }
    
    if (isFullscreen) {
      return "fixed inset-0 cyber-card scanlines z-50 flex flex-col";
    }
    
    if (isMinimized) {
      return "fixed bottom-0 left-0 right-0 cyber-card scanlines z-50 h-12 transition-all duration-300";
    }
    
    return "fixed bottom-0 left-0 right-0 cyber-card scanlines z-50 h-[30vh] transition-all duration-300 flex flex-col";
  };

  return (
    <Card className={getContainerClass()}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b border-primary/30 bg-black/50">
         <div className="flex items-center gap-2">
           <Terminal className="w-4 h-4 text-primary" />
           <span className="text-xs font-mono">CYBER_TERMINAL</span>
         </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-6 w-6 p-0 hover:bg-primary/20"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Expand className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 hover:bg-primary/20"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
           {!embedded && (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setIsOpen(false)}
               className="h-6 w-6 p-0 hover:bg-destructive/20"
               title="Close terminal"
             >
               <X className="w-3 h-3" />
             </Button>
           )}
        </div>
      </div>

{!isMinimized && (
        <>
           {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="flex-1 p-3 pb-16 overflow-y-auto font-mono text-xs bg-black/80"
            >
            {commands.map((command, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-accent">root@cyber:~$</span>
                  <span className="text-primary">{command.input}</span>
                </div>
                {command.output.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                     className={`ml-4 ${
                       command.type === 'error' ? 'text-destructive' :
                       command.type === 'success' ? 'text-secondary-foreground' :
                       'text-muted-foreground'
                     }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sticky Terminal Input - Always visible */}
      {!isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur-sm border-t border-primary/30 z-[60]">
           <div className="flex items-center gap-2 font-mono text-xs">
             <span className="text-accent">root@cyber:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-primary placeholder-muted-foreground terminal-cursor"
              placeholder="Enter command..."
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </Card>
  );
}