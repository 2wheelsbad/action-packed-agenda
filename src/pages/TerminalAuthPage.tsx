import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'system';
  text: string;
  timestamp?: Date;
}

export default function TerminalAuthPage() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'CYBER_PRODUCTIVE v2.0.1 - Authentication Terminal' },
    { type: 'system', text: '================================================' },
    { type: 'system', text: 'Available commands:' },
    { type: 'system', text: '  login -g                     : Google OAuth login' },
    { type: 'system', text: '  login -u=email -p=password   : Email/password login' },
    { type: 'system', text: '  sign-up                      : Create new account' },
    { type: 'system', text: '  help                         : Show this help' },
    { type: 'system', text: '  clear                        : Clear terminal' },
    { type: 'system', text: '================================================' },
    { type: 'system', text: 'Type a command to begin...' },
  ]);
  
  const [currentCommand, setCurrentCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    addLine('output', 'Initiating Google OAuth...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      addLine('output', 'Redirecting to Google...');
    } catch (error: any) {
      addLine('error', `Authentication failed: ${error.message}`);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    setIsProcessing(true);
    addLine('output', `Authenticating user: ${email}`);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      addLine('output', 'Login successful! Redirecting...');
    } catch (error: any) {
      addLine('error', `Login failed: ${error.message}`);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCommand = (command: string) => {
    const trimmed = command.trim();
    
    if (trimmed === 'help') {
      addLine('output', 'Available commands:');
      addLine('output', '  login -g                     : Google OAuth login');
      addLine('output', '  login -u=email -p=password   : Email/password login');
      addLine('output', '  sign-up                      : Create new account');
      addLine('output', '  clear                        : Clear terminal');
      return;
    }
    
    if (trimmed === 'clear') {
      setLines([]);
      return;
    }
    
    if (trimmed === 'sign-up') {
      addLine('output', 'Redirecting to sign-up page...');
      navigate('/auth/signup');
      return;
    }
    
    if (trimmed === 'login -g') {
      handleGoogleLogin();
      return;
    }
    
    // Parse login with email/password
    const loginMatch = trimmed.match(/^login\s+-u=(.+?)\s+-p=(.+)$/);
    if (loginMatch) {
      const [, email, password] = loginMatch;
      handleEmailLogin(email, password);
      return;
    }
    
    // Check for partial login command
    if (trimmed.startsWith('login')) {
      addLine('error', 'Invalid login syntax. Use:');
      addLine('error', '  login -g                     : Google OAuth');
      addLine('error', '  login -u=email -p=password   : Email/password');
      return;
    }
    
    addLine('error', `Unknown command: ${trimmed}`);
    addLine('error', 'Type "help" for available commands');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !currentCommand.trim()) return;
    
    addLine('command', `$ ${currentCommand}`);
    parseCommand(currentCommand);
    setCurrentCommand("");
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-primary';
      case 'output': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'system': return 'text-blue-400';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-black scanlines flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-6 terminal-border border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary neon-glow" />
          <h1 className="text-2xl font-bold font-mono neon-glow">CYBER_PRODUCTIVE</h1>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
        <div 
          ref={terminalRef}
          className="flex-1 bg-black/90 terminal-border p-6 font-mono text-sm overflow-y-auto space-y-1"
        >
          {lines.map((line, index) => (
            <div key={index} className={`${getLineColor(line.type)} leading-relaxed`}>
              {line.type === 'command' && <span className="text-primary">cyber@productive:~$ </span>}
              {line.text}
            </div>
          ))}
          
          {/* Current command line */}
          <div className="flex items-center">
            <span className="text-primary">cyber@productive:~$ </span>
            <form onSubmit={handleSubmit} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none outline-none text-foreground font-mono caret-primary"
                placeholder={isProcessing ? "Processing..." : "Enter command..."}
              />
            </form>
          </div>
          
          {/* Cursor */}
          <div className="w-2 h-4 bg-primary opacity-75 animate-pulse inline-block"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center p-4 text-sm text-muted-foreground font-mono">
        Terminal Auth Interface - Type "help" for commands
      </div>
    </div>
  );
}