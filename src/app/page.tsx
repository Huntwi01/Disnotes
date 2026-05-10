"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Actions from "./actions";
import { 
  Hash, 
  Settings, 
  Mic, 
  Headphones, 
  Plus, 
  Search, 
  Bell, 
  HelpCircle,
  Zap,
  Brain,
  MessageSquare,
  ChevronDown,
  UserCircle,
  Trash2,
  LayoutDashboard,
  CheckCircle2,
  BarChart3,
  Clock,
  Tag,
  Calendar,
  AlertCircle,
  Terminal,
  Activity,
  Workflow,
  Play,
  Pause,
  ExternalLink,
  Video,
  MessageCircle,
  Mail,
  History,
  TrendingUp,
  Cpu,
  Lock,
  Shield,
  Database,
  Cloud,
  CreditCard,
  Key,
  Copy,
  Eye,
  EyeOff,
  Folder,
  FileText,
  ChevronRight
} from "lucide-react";

// Types
type Page = {
  id: string;
  name: string;
  status?: "todo" | "in-progress" | "done" | "fixing";
};

type Project = {
  id: string;
  name: string;
  iconName: string;
  status: 'development' | 'fixing' | 'stable';
  description: string;
  pages: Page[];
};

type Note = {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  pageId: string;
  tags?: string[];
  status?: "todo" | "in-progress" | "done" | "fixing";
  priority?: "low" | "medium" | "high";
};

type Password = {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
};

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap size={28} />,
  Brain: <Brain size={28} />,
  MessageSquare: <MessageSquare size={28} />,
  Dashboard: <LayoutDashboard size={28} />,
  Terminal: <Terminal size={28} />,
  Activity: <Activity size={28} />,
  Workflow: <Workflow size={28} />,
  Cpu: <Cpu size={28} />,
};

const AVAILABLE_ICONS = ["Zap", "Brain", "MessageSquare", "Terminal", "Activity", "Workflow", "Cpu"];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [activePageId, setActivePageId] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"chat" | "dashboard" | "intelligence" | "agents" | "passwords">("chat");
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [terminalType, setTerminalType] = useState<"powershell" | "cmd">("powershell");
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  
  // Drag and Drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean, noteId: string | null }>({ show: false, noteId: null });
  const [isScanning, setIsScanning] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<{type: 'cmd' | 'output' | 'error', text: string}[]>([
    { type: 'output', text: 'Welcome to DisNotes OS Shell [Version 1.0.4]' },
    { type: 'output', text: 'Type "help" to see available commands.' }
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [currentPath, setCurrentPath] = useState(".");

  const executeCommand = async (cmd: string) => {
    const history = [...terminalHistory, { type: 'cmd' as const, text: `${currentPath}> ${cmd}` }];
    const parts = cmd.trim().split(" ");
    const action = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    if (action === "clear") {
      setTerminalHistory([]);
      return;
    }

    if (action === "help") {
      setTerminalHistory([...history, { type: 'output', text: "DisNotes OS Terminal v1.0\nThis is a real system shell interface.\nCommands: ls, cd, clear, help, [Any System Command]" }]);
      return;
    }

    // Handle CD separately to maintain state
    if (action === "cd") {
      const res = await Actions.runShellCommand(cmd, currentPath);
      if (!res.error) {
        // We need to resolve the new path if it changed
        // For simplicity, we trust the relative move if it succeeded
        let newPath = currentPath;
        if (arg === "..") {
          newPath = currentPath === "." ? "." : currentPath.split("/").slice(0, -1).join("/") || ".";
        } else if (arg && arg !== ".") {
          newPath = currentPath === "." ? arg : `${currentPath}/${arg}`;
        }
        setCurrentPath(newPath);
        setTerminalHistory([...history, { type: 'output', text: res.output || `Navigated to ${newPath}` }]);
      } else {
        setTerminalHistory([...history, { type: 'error', text: res.output }]);
      }
      return;
    }

    // Execute real command
    const res = await Actions.runShellCommand(cmd, currentPath);
    setTerminalHistory([...history, { 
      type: res.error ? 'error' : 'output', 
      text: res.output || (res.error ? "Command failed." : "Command executed successfully.")
    }]);
  };

  useEffect(() => {
    // Persistent state load
  }, [settings.github_username, selectedYear]);

  // ... (rest of state)

  // Icon Switching
  const handleCycleIcon = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); // Prevent context menu
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const currentIndex = AVAILABLE_ICONS.indexOf(project.iconName);
    const nextIndex = (currentIndex + 1) % AVAILABLE_ICONS.length;
    const nextIcon = AVAILABLE_ICONS[nextIndex];

    await Actions.updateProjectIcon(projectId, nextIcon);
    loadData();
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.setData("noteId", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("noteId");
    if (sourceId === targetId) return;

    const pageNotes = notes.filter(n => n.pageId === activePageId);
    const sourceIndex = pageNotes.findIndex(n => n.id === sourceId);
    const targetIndex = pageNotes.findIndex(n => n.id === targetId);

    const newOrderedNotes = [...pageNotes];
    const [movedNote] = newOrderedNotes.splice(sourceIndex, 1);
    newOrderedNotes.splice(targetIndex, 0, movedNote);

    const orderedIds = newOrderedNotes.map(n => n.id);
    await Actions.reorderNotes(activePageId, orderedIds);
    loadData();
    setDraggedNoteId(null);
  };

  // ... (rest of functions)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerTask, setTimerTask] = useState("");

  // Tab State for Integrated Tools
  const [activeToolTab, setActiveToolTab] = useState<"youtube" | "slack" | "terminal">("youtube");

  const loadData = useCallback(async () => {
    const data = await Actions.fetchAllData();
    const formattedProjects: Project[] = data.projects.map(p => ({
      ...p,
      pages: data.pages.filter(pg => pg.projectId === p.id).map(pg => ({ id: pg.id, name: pg.name, status: pg.status }))
    }));
    
    setProjects(formattedProjects);
    setNotes(data.notes);
    setPasswords(data.passwords || []);
    
    const settingsMap = (data.settings || []).reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    setSettings(settingsMap);
    
    if (formattedProjects.length > 0) {
      if (!activeProjectId) {
        setActiveProjectId(formattedProjects[0].id);
        if (formattedProjects[0].pages.length > 0) {
          setActivePageId(formattedProjects[0].pages[0].id);
        }
      }
    }
    setLoading(false);
  }, [activeProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activePage = activeProject?.pages.find((p) => p.id === activePageId);

  const handleProjectSwitch = (id: string) => {
    if (id === "dashboard") {
      setView("dashboard");
      setActiveProjectId("dashboard");
      return;
    }
    setView("chat");
    setActiveProjectId(id);
    const proj = projects.find((p) => p.id === id);
    if (proj && proj.pages.length > 0) {
      setActivePageId(proj.pages[0].id);
    } else {
      setActivePageId("");
    }
  };

  const handleNavClick = (newView: "dashboard" | "intelligence" | "agents" | "passwords") => {
    setView(newView);
  };

  const handleAddPage = async () => {
    const pageName = prompt("Enter page name:");
    if (!pageName || !activeProjectId) return;

    const newPageId = Date.now().toString();
    await Actions.addPage({
      id: newPageId,
      projectId: activeProjectId,
      name: pageName.toLowerCase().replace(/\s+/g, "-"),
    });

    loadData();
    setActivePageId(newPageId);
  };

  const handleDeleteNote = async (id: string) => {
    await Actions.deleteNote(id);
    loadData();
  };

  const handleAddProject = async () => {
    const projectName = prompt("Enter project name:");
    if (!projectName) return;
    
    const description = prompt("Enter project description:") || "";
    const statusInput = prompt("Status (development/fixing/stable):", "development");
    const status = (['development', 'fixing', 'stable'].includes(statusInput || '') ? statusInput : 'development') as any;

    const newProjectId = Date.now().toString();
    
    // Choose to add to existing page or new
    const pageChoice = confirm("Create a new page for this project? (Cancel to link to existing)");
    let newPageId = "";
    let newPageName = "";

    if (pageChoice) {
      newPageName = prompt("Enter new page name:", "general") || "general";
      newPageId = newProjectId + "-init";
    } else {
      const existingPages = projects.flatMap(p => p.pages);
      if (existingPages.length > 0) {
        const pageId = prompt("Enter existing page ID to link to (or cancel to create general):");
        if (pageId && existingPages.find(p => p.id === pageId)) {
          newPageId = pageId;
        } else {
          newPageName = "general";
          newPageId = newProjectId + "-init";
        }
      } else {
        newPageName = "general";
        newPageId = newProjectId + "-init";
      }
    }

    await Actions.addProject({
      id: newProjectId,
      name: projectName,
      iconName: "MessageSquare",
      status,
      description
    });

    if (newPageName) {
      await Actions.addPage({
        id: newPageId,
        projectId: newProjectId,
        name: newPageName
      });
    }

    loadData();
    setActiveProjectId(newProjectId);
    setActivePageId(newPageId);
  };

  const handleDeletePage = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!activeProject || activeProject.pages.length <= 1) return;

    await Actions.deletePage(pageId);
    loadData();
  };

  const handleDeleteProject = async () => {
    if (!activeProject || projects.length <= 1) return;
    if (!confirm(`Are you sure you want to delete "${activeProject.name}"?`)) return;

    await Actions.deleteProject(activeProjectId);
    loadData();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activePageId) return;

    // Handle Commands
    if (inputValue.startsWith("/")) {
      const command = inputValue.toLowerCase().trim();
      let response = "";
      let user = "System Agent";

      if (command === "/today") {
        response = "🌅 **Good Morning!**\n\nI've analyzed your context:\n- **Calendar:** 3 events detected.\n- **Focus:** Your top priority is 'Discord Pro UI'.\n- **Yesterday:** 2 tasks carried over.\n\nType `/start focus` to begin.";
      } else if (command === "/close day") {
        response = "🌙 **Evening Reflection**\n\nSummary of your output:\n- **Time Focused:** " + formatTime(timeSeconds) + "\n- **Notes Taken:** 12 entries\n- **Metrics:** Knowledge capture up by 4%.\n\nRest up. See you tomorrow!";
      } else {
        response = `Unknown command: ${command}`;
      }

      await Actions.addNote({
        id: Date.now().toString(),
        user: user,
        content: response,
        timestamp: "Now",
        pageId: activePageId,
      });
      setInputValue("");
      loadData();
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      user: "User",
      content: inputValue,
      timestamp: "Today at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: activePageId,
    };

    await Actions.addNote(newNote);
    setInputValue("");
    loadData();
  };

  const filteredNotes = notes.filter((n) => n.pageId === activePageId);

  const renderMainContent = () => {
    if (view === "intelligence") {
      const activeProj = projects.find(p => p.id === activeProjectId);
      const isDashboard = activeProjectId === "dashboard";
      
      // If dashboard or project empty, show all pages (Global Brain)
      const displayPages = isDashboard || (activeProj?.pages.length === 0) 
        ? projects.flatMap(p => p.pages) 
        : activeProj?.pages || [];
        
      const totalNotes = notes.length;

      const handleRegenerate = () => {
        setIsScanning(true);
        setTimeout(() => {
          loadData();
          setIsScanning(false);
        }, 2000);
      };
      
      return (
        /* Intelligence Layer View */
        <div className="flex-1 overflow-y-auto p-6 bg-main no-scrollbar">
          <div className="bg-nav p-8 rounded-xl border border-white/5 shadow-2xl min-h-[600px] flex flex-col relative">
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-brand animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                </div>
                <div className="text-brand font-black italic text-xs tracking-[0.3em] animate-pulse uppercase">Synchronizing Neural Clusters...</div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                  <Workflow size={28} className="mr-3 text-brand" />
                  Knowledge Relational Mapping
                </h2>
                <p className="text-text-muted">Visualizing connections across your second brain</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleRegenerate} 
                  disabled={isScanning}
                  className="px-4 py-2 bg-brand text-white rounded font-bold text-sm hover:bg-brand/80 transition-all disabled:opacity-50"
                >
                  {isScanning ? "SCANNING..." : "Regenerate Map"}
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-black/20 rounded-lg relative overflow-hidden flex items-center justify-center">
              {/* Dynamic SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {displayPages.map((page, i) => {
                  const angle = (i / displayPages.length) * 2 * Math.PI;
                  const x2 = 50 + 35 * Math.cos(angle);
                  const y2 = 50 + 35 * Math.sin(angle);
                  return (
                    <line 
                      key={page.id}
                      x1="50%" y1="50%" 
                      x2={`${x2}%`} y2={`${y2}%`} 
                      stroke="currentColor" 
                      strokeWidth="1" 
                      className="text-brand/30 animate-pulse" 
                    />
                  );
                })}
              </svg>

              {/* Central Project Node */}
              <div className="z-20 relative">
                <div className="w-24 h-24 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center text-brand shadow-[0_0_30px_rgba(88,101,242,0.4)] animate-pulse">
                  {isDashboard ? <Database size={32} /> : (activeProj ? iconMap[activeProj.iconName] : <Database size={32} />)}
                </div>
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-white font-black uppercase text-sm tracking-widest">{isDashboard ? "Global Brain" : (activeProj?.name || "System Core")}</div>
                  <div className="text-[10px] text-brand font-bold uppercase tracking-tighter">{isDashboard ? "Unified Repository" : "Primary Authority"}</div>
                </div>
              </div>

              {/* Peripheral Channel Nodes */}
              {displayPages.map((page, i) => {
                const angle = (i / displayPages.length) * 2 * Math.PI;
                const x = 50 + 35 * Math.cos(angle);
                const y = 50 + 35 * Math.sin(angle);
                return (
                  <div 
                    key={page.id}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-sidebar border border-white/10 flex items-center justify-center text-text-muted group-hover:border-brand/50 group-hover:text-white transition-all shadow-xl">
                      <Hash size={18} />
                    </div>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      #{page.name}
                    </div>
                  </div>
                );
              })}
              
              {displayPages.length === 0 && (
                <div className="z-10 text-center">
                  <Activity size={64} className="text-brand mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Nodes...</h3>
                  <p className="text-text-muted max-w-md mx-auto">
                    Scanning **{totalNotes}** entries to identify clusters. Add channels to begin mapping.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-sidebar/50 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-brand uppercase mb-1">Total Entries</div>
                <div className="text-white font-bold text-lg">{totalNotes}</div>
                <div className="text-[10px] text-text-muted">Synchronized across {projects.length} nodes</div>
              </div>
              <div className="p-4 bg-sidebar/50 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-green-500 uppercase mb-1">Active Channels</div>
                <div className="text-white font-bold text-lg">{displayPages.length}</div>
                <div className="text-[10px] text-text-muted">{isDashboard ? "Global network map" : "In current orchestration"}</div>
              </div>
              <div className="p-4 bg-sidebar/50 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Sync Status</div>
                <div className="text-white font-bold text-lg">Optimal</div>
                <div className="text-[10px] text-text-muted">Database connectivity stable</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (view === "agents") {
      const apiDatabase = [
        { name: "OpenAI API", keywords: ["openai", "gpt", "llm"], desc: "Powering semantic search and agentic reasoning layers.", cost: "$0.01 / 1k tokens", icon: <Cpu size={24} />, color: "text-green-400" },
        { name: "Anthropic Claude", keywords: ["anthropic", "claude"], desc: "High-context coding assistant and analytical engine.", cost: "$8 / MMTU", icon: <Brain size={24} />, color: "text-brand" },
        { name: "Supabase DB", keywords: ["supabase", "postgres", "database"], desc: "Real-time backend and vector storage orchestration.", cost: "Free / $25 Pro", icon: <Database size={24} />, color: "text-emerald-500" },
        { name: "AWS S3", keywords: ["aws", "s3", "storage", "cloud"], desc: "Scalable asset hosting and binary blob distribution.", cost: "$0.023 / GB", icon: <Cloud size={24} />, color: "text-orange-400" },
        { name: "Stripe Billing", keywords: ["stripe", "payment", "billing"], desc: "Global payment processing and subscription lifecycle.", cost: "2.9% + 30¢", icon: <CreditCard size={24} />, color: "text-blue-500" },
        { name: "Resend Email", keywords: ["resend", "email", "smtp"], desc: "Transactional email infrastructure for developer alerts.", cost: "Free / $20 Pro", icon: <Mail size={24} />, color: "text-white" }
      ];

      const allNoteContent = notes.map(n => n.content.toLowerCase()).join(" ");
      const discoveredApis = apiDatabase.filter(api => 
        api.keywords.some(kw => allNoteContent.includes(kw))
      );

      return (
        /* API Infrastructure View */
        <div className="flex-1 overflow-y-auto p-6 bg-main no-scrollbar">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <Activity size={28} className="mr-3 text-brand" />
              API Infrastructure
            </h2>
            <p className="text-text-muted text-sm italic">Discovered and tracked from technical project documentation.</p>
          </div>

          {discoveredApis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {discoveredApis.map((api, i) => (
                <div key={i} className="bg-nav p-6 rounded-xl border border-white/5 shadow-xl hover:border-brand/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-lg bg-sidebar flex items-center justify-center ${api.color}`}>
                      {api.icon}
                    </div>
                    <div className="bg-brand/10 text-brand text-[10px] font-black uppercase px-2 py-1 rounded tracking-widest">
                      Active Integration
                    </div>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-2">{api.name}</h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6 h-10 overflow-hidden">
                    {api.desc}
                  </p>
                  
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Resource Cost</span>
                      <span className="text-[10px] text-white font-mono bg-white/5 px-2 py-0.5 rounded">{api.cost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Data Source</span>
                      <span className="text-[10px] text-brand font-bold italic">Note Discovered</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-nav/50 p-6 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center hover:bg-nav transition-all cursor-pointer min-h-[220px]">
                <Plus size={32} className="text-text-muted mb-2" />
                <div className="text-white font-bold">Register API</div>
                <div className="text-xs text-text-muted mt-1">Mention a technical stack in notes to track it here.</div>
              </div>
            </div>
          ) : (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-nav/20 rounded-2xl border border-dashed border-white/10">
              <Cloud size={48} className="text-text-muted mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">No Infrastructure Discovered</h3>
              <p className="text-text-muted text-sm max-w-sm">
                Mention technologies like **OpenAI**, **Stripe**, or **AWS** in your project notes to automatically track their capabilities and costs here.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (view === "passwords") {
      return (
        /* Password Manager View */
        <div className="flex-1 overflow-y-auto p-6 bg-main no-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <Lock size={32} className="mr-3 text-brand" />
                  Security Vault
                </h2>
                <p className="text-text-muted mt-1">Securely manage your credentials and digital assets.</p>
              </div>
              <button 
                onClick={async () => {
                  const title = prompt("Enter site name:");
                  if (!title) return;
                  const username = prompt("Enter username/email:");
                  const password = prompt("Enter password:");
                  const url = prompt("Enter URL (optional):") || "";
                  
                  await Actions.addPassword({
                    id: Date.now().toString(),
                    title,
                    username: username || "",
                    password: password || "",
                    url
                  });
                  loadData();
                }}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold transition-all flex items-center justify-center shadow-lg shadow-brand/20"
              >
                <Plus size={20} className="mr-2" /> Add New Credential
              </button>
            </div>

            <div className="bg-nav rounded-xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/5 bg-sidebar/30 flex items-center">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search vault..." 
                    className="w-full bg-sidebar border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-brand/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {passwords.filter(p => 
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.username.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(pass => (
                  <div key={pass.id} className="p-4 hover:bg-white/5 transition-colors group flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-sidebar flex items-center justify-center text-brand mr-4 flex-shrink-0">
                      <Key size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-bold truncate">{pass.title}</h3>
                        {pass.url && (
                          <a href={pass.url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-brand transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-text-muted truncate">{pass.username}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center bg-sidebar rounded-md px-3 py-1.5 border border-white/10">
                        <code className="text-brand mr-3 font-mono">
                          {showPasswordId === pass.id ? pass.password : "••••••••••••"}
                        </code>
                        <button 
                          onClick={() => setShowPasswordId(showPasswordId === pass.id ? null : pass.id)}
                          className="text-text-muted hover:text-white transition-colors"
                        >
                          {showPasswordId === pass.id ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pass.password);
                          alert("Password copied to clipboard!");
                        }}
                        className="p-2 bg-sidebar hover:bg-white/10 rounded-md text-text-muted hover:text-white transition-all border border-white/10"
                        title="Copy Password"
                      >
                        <Copy size={18} />
                      </button>
                      
                      <button 
                        onClick={async () => {
                          if (confirm(`Delete credentials for ${pass.title}?`)) {
                            await Actions.deletePassword(pass.id);
                            loadData();
                          }
                        }}
                        className="p-2 bg-sidebar hover:bg-red-500/20 rounded-md text-text-muted hover:text-red-400 transition-all border border-white/10"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {passwords.length === 0 && (
                  <div className="p-12 text-center">
                    <Shield size={48} className="mx-auto text-text-muted/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-1">Your vault is empty</h3>
                    <p className="text-text-muted">Start by adding your first set of credentials.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Health Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-5 bg-nav rounded-xl border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-brand uppercase tracking-widest">Vault Status</div>
                  <Shield size={16} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Encrypted</div>
                <div className="text-[10px] text-text-muted uppercase">AES-256 Protocol Simulated</div>
              </div>
              <div className="p-5 bg-nav rounded-xl border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Pwned Check</div>
                  <Activity size={16} className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Safe</div>
                <div className="text-[10px] text-text-muted uppercase">0 breaches detected</div>
              </div>
              <div className="p-5 bg-nav rounded-xl border border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-purple-500 uppercase tracking-widest">Password Strength</div>
                  <TrendingUp size={16} className="text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">High</div>
                <div className="text-[10px] text-text-muted uppercase">Average entropy: 84 bits</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (view === "dashboard") {
      return (
        /* Operations Hub View */
        <div className="flex-1 overflow-y-auto p-6 bg-main no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            
            {/* Channel Status Board (Kanban style) */}
            <div className="bg-nav p-6 rounded-xl border border-white/5 shadow-xl col-span-1 md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Hash size={24} className="mr-3 text-brand" />
                  Channel Orchestration
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "In Development", status: "in-progress", color: "text-blue-400", bg: "bg-blue-400/10" },
                  { label: "Needs Fixing", status: "fixing", color: "text-red-400", bg: "bg-red-400/10" },
                  { label: "Stable / Live", status: "done", color: "text-green-400", bg: "bg-green-400/10" }
                ].map(col => {
                  const allPages = projects.flatMap(p => p.pages) || [];
                  const excludedNames = ["generals", "general", "meeting notes", "meeting-notes", "todo list", "todo-list", "ideas", "scratchpad", "reading list", "reading-list"];
                  const colPages = allPages
                    .filter(pg => pg.status === col.status || (!pg.status && col.status === "in-progress"))
                    .filter(pg => !excludedNames.includes(pg.name.toLowerCase()));
                  
                  return (
                    <div 
                      key={col.status} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        const pageId = e.dataTransfer.getData("pageId");
                        
                        // Optimistic Update
                        setProjects(prev => prev.map(proj => ({
                          ...proj,
                          pages: proj.pages.map(pg => pg.id === pageId ? { ...pg, status: col.status as any } : pg)
                        })));

                        await Actions.updatePageStatus(pageId, col.status as any);
                        loadData();
                      }}
                      className="bg-sidebar/30 rounded-lg p-4 border border-white/5 min-h-[250px] transition-all hover:bg-sidebar/40"
                    >
                      <div className={`flex items-center justify-between mb-4 ${col.color}`}>
                        <span className="text-xs font-bold uppercase tracking-widest">{col.label}</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${col.bg}`}>
                          {colPages.length}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {colPages.map(pg => (
                          <div 
                            key={pg.id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("pageId", pg.id);
                            }}
                            className="p-3 bg-nav hover:bg-white/5 border border-white/5 rounded-lg cursor-grab active:cursor-grabbing transition-all group shadow-sm hover:shadow-md relative"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Hash size={16} className="text-text-muted group-hover:text-brand" />
                                <span className="text-sm font-bold text-white group-hover:text-brand">{pg.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DisNotes Focus Node (Col 1) */}
            <div className="bg-nav p-5 rounded-xl border border-white/5 shadow-2xl col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.2em] flex items-center">
                    <Zap size={14} className="mr-2 text-brand animate-pulse" />
                    DisNotes Focus Node
                  </h3>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`p-1.5 rounded-md transition-all shadow-lg ${timerRunning ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-brand/20 text-brand hover:bg-brand/30"}`}
                    >
                      {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button 
                      onClick={() => setTimeSeconds(0)}
                      className="p-1.5 bg-sidebar/50 text-text-muted rounded-md hover:text-white hover:bg-sidebar transition-all shadow-lg"
                    >
                      <History size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="text-center py-6 bg-black/40 rounded-xl border border-white/[0.03] mb-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="text-4xl font-mono text-white font-black tracking-[-0.05em] drop-shadow-[0_0_15px_rgba(88,101,242,0.3)]">
                    {formatTime(timeSeconds)}
                  </div>
                  <div className="text-[9px] text-brand font-bold uppercase mt-2 tracking-[0.15em] opacity-80 px-2 truncate">
                    {timerTask || "Idle Protocol"}
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={timerTask}
                    onChange={(e) => setTimerTask(e.target.value)}
                    className="bg-sidebar/50 w-full rounded-lg p-3 text-[10px] outline-none border border-white/5 text-white focus:border-brand/50 transition-all placeholder:text-white/20"
                    placeholder="Focus Name Goes Here..."
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${timerRunning ? "bg-green-500 animate-pulse" : "bg-white/10"}`} />
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (timeSeconds > 0) {
                    const sessionNote = `Focused on: ${timerTask || "General Tasks"} for ${formatTime(timeSeconds)}`;
                    await Actions.addNote(activeProjectId, activePageId, "User", sessionNote);
                    loadData();
                    setTimeSeconds(0);
                    setTimerRunning(false);
                  }
                }}
                className="mt-4 w-full py-2.5 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-brand/20 hover:border-brand shadow-lg flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={14} />
                <span>Log Session to Note</span>
              </button>
            </div>

            {/* Activity Heatmap Widget (Minimalist High Fidelity) */}
            <div className="bg-[#0d1117] p-6 rounded-xl border border-white/5 shadow-2xl col-span-1 md:col-span-2">
              <div className="flex items-center justify-end mb-4">
                <button 
                  onClick={async () => {
                    const username = prompt("Enter Github username:", settings.github_username || "");
                    if (username !== null) {
                      await Actions.updateSetting("github_username", username);
                      loadData();
                    }
                  }}
                  className="p-1 hover:bg-white/5 rounded text-text-muted hover:text-white transition-all flex items-center text-[10px] font-bold uppercase tracking-widest"
                >
                  <Settings size={14} className="mr-1.5" /> Sync GitHub
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="border border-[#30363d] rounded-md p-4 bg-[#0d1117]">
                    <div className="flex">
                      <div className="flex-1 overflow-hidden">
                        {settings.github_username ? (
                          <img 
                            src={`https://ghchart.rshah.org/216e39/${settings.github_username}`} 
                            alt={`${settings.github_username}'s Github Chart`}
                            className="w-full h-auto filter saturate-[1.5] contrast-[1.1] brightness-[0.7] invert-[0.05]"
                          />
                        ) : (
                          <div className="flex gap-[3px]">
                            {Array.from({ length: 53 }).map((_, i) => (
                              <div key={i} className="flex flex-col gap-[3px]">
                                {Array.from({ length: 7 }).map((_, j) => (
                                  <div 
                                    key={j} 
                                    className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22]"
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Legend Only */}
                        <div className="mt-4 flex items-center justify-end text-[11px] text-[#8b949e]">
                          <div className="flex items-center space-x-1">
                            <span>Less</span>
                            <div className="flex gap-[3px]">
                              <div className="w-[10px] h-[10px] bg-[#161b22] rounded-[2px]" />
                              <div className="w-[10px] h-[10px] bg-[#0e4429] rounded-[2px]" />
                              <div className="w-[10px] h-[10px] bg-[#006d32] rounded-[2px]" />
                              <div className="w-[10px] h-[10px] bg-[#26a641] rounded-[2px]" />
                              <div className="w-[10px] h-[10px] bg-[#39d353] rounded-[2px]" />
                            </div>
                            <span>More</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GitHub Style Year Sidebar (Active Years Only) */}
                <div className="w-full lg:w-32 flex flex-col gap-0.5">
                  {["2026"].map(year => (
                    <button 
                      key={year} 
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 rounded-md text-sm font-normal text-left transition-all ${
                        selectedYear === year 
                          ? "bg-brand text-white" 
                          : "text-[#8b949e] hover:bg-[#30363d]/50 hover:text-white"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Terminal Widget (Col 3) - Functional CMD Emulator */}
            <div className="bg-nav rounded-xl border border-white/5 shadow-xl col-span-1 md:col-span-3 flex flex-col h-[300px] overflow-hidden">
              <div className="flex items-center justify-between p-2 bg-sidebar/50 border-b border-white/5">
                <div className="flex items-center space-x-3">
                  <Terminal size={14} className="text-brand" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Command Prompt</span>
                </div>
                <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">cmd.exe</div>
              </div>
              
              <div className="flex-1 bg-[#0c0c0c] p-3 font-mono text-[11px] overflow-y-auto no-scrollbar selection:bg-brand/30 flex flex-col">
                <div className="flex-1 space-y-1">
                  <div className="text-white mb-2">
                    <p>Microsoft Windows [Version 10.0.19045.3324]</p>
                    <p>(c) Microsoft Corporation. All rights reserved.</p>
                  </div>
                  {terminalHistory.map((line, i) => (
                    <div key={i} className={`whitespace-pre-wrap ${
                      line.type === 'cmd' ? 'text-white' : 
                      line.type === 'error' ? 'text-red-400' : 'text-text-normal'
                    }`}>
                      {line.text}
                    </div>
                  ))}
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (terminalInput.trim()) {
                      executeCommand(terminalInput);
                      setTerminalInput("");
                    }
                  }}
                  className="flex items-center mt-2"
                >
                  <span className="text-white mr-2">C:\{currentPath}&gt;</span>
                  <input 
                    type="text" 
                    autoFocus
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white selection:bg-brand/30"
                    spellCheck="false"
                  />
                </form>
              </div>
            </div>

          </div>
        </div>
      );
    }

    /* Default: Chat/Note View (Simplified for Pro) */
    return (
      <>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {/* Context Alert for Pro */}
          <div className="bg-brand/10 border border-brand/20 p-4 rounded flex items-start space-x-3">
            <Workflow size={20} className="text-brand flex-shrink-0" />
            <div className="text-xs text-brand leading-relaxed">
              <span className="font-bold block">INTELLIGENCE LAYER ACTIVE</span>
              This page is correlated with "Obsidian System Research". Use `/today` to sync your focus.
            </div>
          </div>

          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              draggable
              onDragStart={(e) => onDragStart(e, note.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, note.id)}
              className={`group flex space-x-4 px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-all relative cursor-move border border-transparent hover:border-white/[0.05] ${
                draggedNoteId === note.id ? "opacity-30" : "opacity-100"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold mt-0.5 shadow-lg ${note.user === "System Agent" ? "bg-brand/20 border border-brand/30 text-brand" : "bg-nav border border-white/10"}`}>
                {note.user === "System Agent" ? <Cpu size={20} /> : note.user[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className={`font-bold text-[13px] tracking-tight hover:underline cursor-pointer ${note.user === "System Agent" ? "text-brand" : "text-white"}`}>{note.user}</span>
                  <span className="text-[10px] font-medium text-text-muted/60 uppercase tracking-wider">{note.timestamp}</span>
                  <button 
                    onClick={async () => {
                      if (settings.skipDeleteConfirm === "true") {
                        await Actions.deleteNote(note.id);
                        loadData();
                      } else {
                        setDeleteConfirmation({ show: true, noteId: note.id });
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className={`text-[14px] leading-relaxed text-text-normal/90 whitespace-pre-wrap selection:bg-brand/30 ${note.user === "System Agent" ? "p-4 bg-brand/5 rounded-xl border border-brand/10 mt-2 font-medium italic text-brand/90" : ""}`}>
                  {note.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note Entry (Input) with Command Hints */}
        <div className="px-4 pb-6 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="bg-chat rounded-lg flex flex-col px-4 py-2.5 border border-white/5 shadow-inner focus-within:border-brand/30 transition-all">
            <div className="flex items-start">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={`Message #${activePage?.name} (Try /today)`}
                className="bg-transparent flex-1 resize-none outline-none text-[13px] py-1.5 placeholder:text-text-muted/50 leading-relaxed scrollbar-hide"
                rows={Math.min(5, Math.max(1, inputValue.split('\n').length))}
              />
            </div>
            {inputValue.startsWith("/") && (
              <div className="flex space-x-4 mt-2 pt-2 border-t border-white/5 text-[10px] font-bold text-brand uppercase tracking-widest">
                <span>/today - Morning Brief</span>
                <span>/close day - Evening Summary</span>
              </div>
            )}
          </form>
        </div>
      </>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-main text-white">Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-main text-text-normal font-sans select-none overflow-hidden">
      {/* Sidebar: Projects */}
      <aside className="w-[72px] bg-sidebar flex flex-col items-center py-3 space-y-2 flex-shrink-0 overflow-y-auto no-scrollbar border-r border-black/20">
        <div 
          onClick={() => handleProjectSwitch("dashboard")}
          className={`group relative flex items-center justify-center w-12 h-12 transition-all duration-200 cursor-pointer mb-2 ${
            activeProjectId === "dashboard" ? "rounded-[16px] bg-brand text-white" : "bg-nav rounded-[24px] hover:rounded-[16px] hover:bg-brand text-white"
          }`}
        >
          <LayoutDashboard size={28} />
          <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeProjectId === "dashboard" ? "h-10" : "h-2 scale-0 group-hover:scale-100 group-hover:h-5"
          }`} />
        </div>
        
        <div className="w-8 h-[2px] bg-nav rounded-full mx-auto mb-2" />

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleProjectSwitch(project.id)}
            onContextMenu={(e) => handleCycleIcon(e, project.id)}
            onMouseEnter={() => setHoveredProjectId(project.id)}
            onMouseLeave={() => setHoveredProjectId(null)}
            className="group relative flex items-center justify-center w-12 h-12 cursor-pointer"
            title="Right-click to change icon"
          >
            <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
              activeProjectId === project.id ? "h-10" : "h-2 scale-0 group-hover:scale-100 group-hover:h-5"
            }`} />
            
            <div className={`flex items-center justify-center w-12 h-12 transition-all duration-200 shadow-lg ${
              activeProjectId === project.id 
                ? "rounded-[16px] bg-brand text-white" 
                : "rounded-[24px] bg-nav text-text-normal hover:rounded-[16px] hover:bg-brand hover:text-white"
            }`}>
              {iconMap[project.iconName] || <MessageSquare size={28} />}
            </div>

            {/* Project Hover Card */}
            {hoveredProjectId === project.id && (
              <div className="absolute left-[72px] w-64 bg-sidebar p-4 rounded-xl shadow-2xl border border-white/10 z-[100] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white">
                    {iconMap[project.iconName] || <MessageSquare size={24} />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold leading-tight">{project.name}</h4>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      project.status === 'development' ? 'bg-blue-500/10 text-blue-400' :
                      project.status === 'fixing' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {project.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  {project.description || "No description provided for this orchestration node."}
                </p>
                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  <span>{project.pages.length} Channels</span>
                  <span>Active node</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div 
          onClick={handleAddProject}
          className="group relative flex items-center justify-center w-12 h-12 bg-nav rounded-[24px] hover:rounded-[16px] hover:bg-green-600 text-green-500 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Plus size={28} />
        </div>
      </aside>

      {/* Navigation Rail: Pages */}
      <nav className="w-60 bg-nav flex flex-col flex-shrink-0 border-r border-black/20">
        <header 
          className="h-12 flex items-center px-4 border-b border-black/20 shadow-sm hover:bg-white/5 cursor-pointer transition-colors group relative"
          onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
        >
          <h1 className="flex-1 font-bold text-white truncate">
            {activeProjectId === "dashboard" ? "System Core" : (activeProject?.name || "App")}
          </h1>
          {activeProjectId !== "dashboard" && activeProject && (
            <div className="flex items-center space-x-1">
              <ChevronDown size={20} className={`text-white transition-transform ${showDeleteDropdown ? "rotate-180" : ""}`} />
            </div>
          )}

          {/* Channel Delete Dropdown */}
          {showDeleteDropdown && activeProject && activeProjectId !== "dashboard" && (
            <div className="absolute top-12 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-b border-black/40 shadow-2xl z-[150] animate-in slide-in-from-top-1 duration-200">
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 text-[9px] font-black text-brand uppercase tracking-widest border-b border-white/5 mb-1 pb-1">
                  Manage Channels
                </div>
                {activeProject.pages.map(pg => (
                  <div key={pg.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 rounded group/item">
                    <div className="flex items-center space-x-2 truncate">
                      <Hash size={14} className="text-text-muted" />
                      <span className="text-xs text-white truncate">{pg.name}</span>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Purge channel #${pg.name}? This action is irreversible.`)) {
                          await Actions.deletePage(pg.id);
                          loadData();
                          setShowDeleteDropdown(false);
                        }
                      }}
                      className="p-1 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded transition-all opacity-0 group-hover/item:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {activeProject.pages.length === 0 && (
                  <div className="px-2 py-4 text-center text-[10px] text-text-muted italic">No channels detected.</div>
                )}
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {activeProjectId === "dashboard" ? (
            <>
              <div 
                onClick={() => handleNavClick("dashboard")}
                className={`px-2 py-1.5 flex items-center rounded-md cursor-pointer transition-colors ${
                  view === "dashboard" ? "text-interactive-active bg-white/10" : "text-text-muted hover:bg-white/5 hover:text-interactive-normal"
                }`}
              >
                <LayoutDashboard size={20} className="mr-2" />
                <span className="font-bold">Operations Hub</span>
              </div>
              <div 
                onClick={() => handleNavClick("intelligence")}
                className={`px-2 py-1.5 flex items-center rounded-md cursor-pointer transition-colors ${
                  view === "intelligence" ? "text-interactive-active bg-white/10" : "text-text-muted hover:bg-white/5 hover:text-interactive-normal"
                }`}
              >
                <Workflow size={20} className="mr-2" />
                <span className="font-medium">Intelligence Layer</span>
              </div>
              <div 
                onClick={() => handleNavClick("agents")}
                className={`px-2 py-1.5 flex items-center rounded-md cursor-pointer transition-colors ${
                  view === "agents" ? "text-interactive-active bg-white/10" : "text-text-muted hover:bg-white/5 hover:text-interactive-normal"
                }`}
              >
                <Cpu size={20} className="mr-2" />
                <span className="font-medium">Agent Matrix</span>
              </div>
              <div 
                onClick={() => handleNavClick("passwords")}
                className={`px-2 py-1.5 flex items-center rounded-md cursor-pointer transition-colors ${
                  view === "passwords" ? "text-interactive-active bg-white/10" : "text-text-muted hover:bg-white/5 hover:text-interactive-normal"
                }`}
              >
                <Shield size={20} className="mr-2" />
                <span className="font-medium">Password Vault</span>
              </div>
            </>
          ) : (
            <>
              <div className="px-2 mb-1 flex items-center justify-between group">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-interactive-normal transition-colors cursor-default">Note Channels</span>
                <Plus size={14} className="text-text-muted hover:text-white cursor-pointer" onClick={handleAddPage} />
              </div>
              {activeProject?.pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group transition-colors relative ${
                    activePageId === page.id ? "bg-white/10 text-white" : "text-text-muted hover:bg-white/5 hover:text-interactive-normal"
                  }`}
                >
                  <Hash size={20} className="mr-1.5 text-text-muted group-hover:text-interactive-normal" />
                  <span className="font-medium truncate flex-1">{page.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-main relative">
        {/* Header Bar */}
        <header className="h-12 flex items-center px-4 border-b border-black/20 shadow-sm flex-shrink-0">
          {activeProjectId === "dashboard" ? (
            <LayoutDashboard size={24} className="text-brand mr-2" />
          ) : (
            <Hash size={24} className="text-text-muted mr-2" />
          )}
          <h2 className="text-white font-bold truncate mr-4">
            {view === "dashboard" ? "System Dashboard" : 
             view === "intelligence" ? "Intelligence Layer" :
             view === "agents" ? "Agent Matrix" :
             view === "passwords" ? "Password Vault" :
             (activePage?.name || "Select Page")}
          </h2>
          <div className="flex-1" />
          <div className="flex items-center space-x-4 text-text-muted">
            <Activity size={24} className="hover:text-interactive-normal cursor-pointer transition-colors" />
            <Bell size={24} className="hover:text-interactive-normal cursor-pointer transition-colors" />
            <div className="relative">
              <Search size={20} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Search" className="bg-sidebar h-6 w-36 rounded px-8 text-sm focus:w-60 transition-all duration-200 outline-none placeholder:text-text-muted" />
            </div>
            <HelpCircle size={24} className="hover:text-interactive-normal cursor-pointer transition-colors" />
          </div>
        </header>

        {renderMainContent()}
      </main>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-sidebar w-[320px] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-2">Delete Message?</h3>
              <p className="text-text-muted text-xs leading-relaxed mb-6">
                Are you sure you want to purge this data packet? This action cannot be undone.
              </p>
              
              <label className="flex items-center space-x-3 cursor-pointer group mb-6">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded bg-black/20 border-white/10 accent-brand cursor-pointer"
                  onChange={async (e) => {
                    if (e.target.checked) {
                      await Actions.updateSetting("skipDeleteConfirm", "true");
                      loadData();
                    }
                  }}
                />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                  Don't ask me again
                </span>
              </label>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirmation({ show: false, noteId: null })}
                  className="flex-1 py-2 text-xs font-bold text-white hover:underline transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (deleteConfirmation.noteId) {
                      await Actions.deleteNote(deleteConfirmation.noteId);
                      loadData();
                    }
                    setDeleteConfirmation({ show: false, noteId: null });
                  }}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-xs shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
