import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Minimize2, Maximize2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  const [isOpen, setIsOpen] = useState(embedded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [commands, setCommands] = useState<Command[]>([
    {
      input: "system.boot()",
      output: [
        ">>> CYBERPUNK PRODUCTIVITY TERMINAL v2.077 <<<",
        ">>> Initializing neural interface...",
        ">>> Connection established",
        ">>> Type 'help' for available commands",
      ],
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

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

  const executeCommand = (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    const args = trimmedInput.split(' ');
    const command = args[0].toLowerCase();
    
    let output: string[] = [];
    let type: 'success' | 'error' | 'info' = 'info';

    switch (command) {
      case 'help':
        output = [
          "AVAILABLE COMMANDS:",
          "├── todo.add <task> [--priority=low|medium|high]",
          "├── time.log <activity> <duration_minutes>",
          "├── calendar.add <event_title> [--date=YYYY-MM-DD]",
          "├── note.add <title> <content> [--tags=tag1,tag2]",
          "├── sys.status - Show system status",
          "├── clear - Clear terminal",
          "└── hack.time - Show current time",
          "",
          "Examples:",
          "• todo.add 'Complete project' --priority=high",
          "• time.log 'Deep work' 120",
          "• calendar.add 'Team meeting' --date=2024-01-15",
          "• note.add 'Ideas' 'Some great ideas for project' --tags=work,ideas"
        ];
        type = 'success';
        break;

      case 'todo.add':
        if (args.length < 2) {
          output = ["ERROR: Task description required"];
          type = 'error';
        } else {
          const priorityFlag = args.find(arg => arg.startsWith('--priority='));
          const priority = priorityFlag ? priorityFlag.split('=')[1] as 'low' | 'medium' | 'high' : 'medium';
          const taskText = args.slice(1).filter(arg => !arg.startsWith('--')).join(' ').replace(/['"]/g, '');
          
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

      case 'time.log':
        if (args.length < 3) {
          output = ["ERROR: Usage: time.log <activity> <duration_minutes>"];
          type = 'error';
        } else {
          const duration = parseInt(args[args.length - 1]);
          const activity = args.slice(1, -1).join(' ').replace(/['"]/g, '');
          
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

      case 'calendar.add':
        if (args.length < 2) {
          output = ["ERROR: Event title required"];
          type = 'error';
        } else {
          const dateFlag = args.find(arg => arg.startsWith('--date='));
          const date = dateFlag ? new Date(dateFlag.split('=')[1]) : new Date();
          const title = args.slice(1).filter(arg => !arg.startsWith('--')).join(' ').replace(/['"]/g, '');
          
          if (dateFlag && isNaN(date.getTime())) {
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

      case 'note.add':
        if (args.length < 3) {
          output = ["ERROR: Usage: note.add <title> <content> [--tags=tag1,tag2]"];
          type = 'error';
        } else {
          const tagsFlag = args.find(arg => arg.startsWith('--tags='));
          const tags = tagsFlag ? tagsFlag.split('=')[1].split(',').map(tag => tag.trim()) : [];
          const argsWithoutFlags = args.slice(1).filter(arg => !arg.startsWith('--'));
          
          if (argsWithoutFlags.length < 2) {
            output = ["ERROR: Both title and content are required"];
            type = 'error';
          } else {
            const title = argsWithoutFlags[0].replace(/['"]/g, '');
            const content = argsWithoutFlags.slice(1).join(' ').replace(/['"]/g, '');
            
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
        }
        break;

      case 'sys.status':
        output = [
          "SYSTEM STATUS:",
          "├── Neural Interface: ONLINE",
          "├── Productivity Matrix: ACTIVE",
          "├── Data Streams: FLOWING",
          "├── Memory Usage: 42.7%",
          "└── Threat Level: MINIMAL",
          "",
          `Current Time: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
        ];
        type = 'success';
        break;

      case 'hack.time':
        output = [
          `> Accessing temporal matrix...`,
          `> Current timestamp: ${Date.now()}`,
          `> Local time: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
          `> Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        ];
        type = 'success';
        break;

      case 'clear':
        setCommands([]);
        setCurrentInput("");
        return;

      default:
        output = [
          `Command '${command}' not recognized.`,
          "Type 'help' for available commands."
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

  const containerClass = embedded 
    ? "w-full h-full cyber-card scanlines flex flex-col"
    : `fixed bottom-4 right-4 w-96 cyber-card scanlines z-50 ${isMinimized ? 'h-12' : 'h-96'} transition-all duration-300`;

  return (
    <Card className={containerClass}>
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
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 hover:bg-primary/20"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
           {!embedded && (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setIsOpen(false)}
               className="h-6 w-6 p-0 hover:bg-destructive/20"
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
             className={`flex-1 p-3 overflow-y-auto font-mono text-xs bg-black/80 ${embedded ? '' : 'max-h-64'}`}
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

          {/* Terminal Input */}
          <div className="p-3 border-t border-primary/30 bg-black/50">
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
        </>
      )}
    </Card>
  );
}