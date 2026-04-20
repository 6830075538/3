/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Book, 
  Users, 
  Globe, 
  ChevronRight, 
  LayoutDashboard,
  Trash2,
  Save,
  ArrowLeft,
  Settings,
  Menu,
  Cloud,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { Project, TabType, Template } from './types';
import { cn } from './lib/utils';
import { DEFAULT_TEMPLATES } from './components/constants';

// Components
import PlotTimeline from './components/PlotTimeline';
import CharacterProfiles from './components/CharacterProfiles';
import WorldBuilding from './components/WorldBuilding';
import SupabaseDashboard, { AuthSection } from './components/SupabaseDashboard';
import { supabase } from './lib/supabase';

const STORAGE_KEY = 'plotweave_projects';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Plot');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPitch, setNewProjectPitch] = useState('');
  const [session, setSession] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [libraryView, setLibraryView] = useState<'grid' | 'list'>('grid');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowLoginModal(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
        setLastSaved(Date.now());
      } catch (e) {
        console.error('Failed to parse projects', e);
      }
    }
  }, []);

  // Save projects to localStorage (Reactive)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    setLastSaved(Date.now());
  }, [projects]);

  // Explicit Auto-save interval (every 60s) as requested
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      setLastSaved(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, [projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      elevatorPitch: newProjectPitch,
      plotLines: [{ id: 'main', title: 'Main Plot', color: '#6366F1' }],
      timepoints: [
        { id: 't1', title: 'Chapter 1' },
        { id: 't2', title: 'Chapter 2' },
        { id: 't3', title: 'Chapter 3' },
      ],
      plotCards: [],
      characters: [],
      worldEntities: [],
      templates: DEFAULT_TEMPLATES,
      lastModified: Date.now(),
    };

    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    setIsCreating(false);
    setNewProjectName('');
    setNewProjectPitch('');
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...updatedProject, lastModified: Date.now() } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    setDeletingProjectId(null);
  };

  if (!activeProjectId) {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans">
        {/* Modern Nav-less Header */}
        <header className="px-6 md:px-12 py-8 flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white rotate-3 shadow-lg shadow-accent/20">
              <Book size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">Plotweave</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-semibold text-text-sub hover:text-text-main transition-colors hidden sm:block">Community</button>
            {session ? (
               <div className="flex items-center gap-3 bg-accent-soft px-4 py-2 rounded-full border border-border">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-[10px] text-white">
                    {session.user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-accent hidden lg:block">{session.user.email}</span>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="text-[10px] font-black uppercase tracking-widest text-text-sub hover:text-red-500 transition-colors ml-2"
                  >
                    Logout
                  </button>
               </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Sign In
              </button>
            )}
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-accent text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:bg-accent/90 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              New Story
            </button>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-6 md:px-12 pb-20">
          {/* Hero Section */}
          <section className="py-12 md:py-20 text-center relative overflow-hidden rounded-[3rem] bg-accent-soft mb-16 border border-border/50">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-7xl font-bold mb-6 tracking-tighter font-display leading-[0.9]">What will you <br/><span className="italic text-primary">weave</span> today?</h2>
              <p className="text-lg md:text-xl text-text-sub max-w-2xl mx-auto font-serif italic mb-10">
                Transform your sparks into structured masterpieces.
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setIsCreating(true)} className="px-8 py-4 bg-white border border-border rounded-2xl font-bold shadow-sm hover:border-accent transition-all flex items-center gap-3">
                  <div className="p-2 bg-accent/5 rounded-lg text-accent"><Plus size={18}/></div>
                  Start from scratch
                </button>
                {!session && (
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="px-8 py-4 bg-accent text-white rounded-2xl font-bold border border-accent hover:bg-accent/90 transition-all flex items-center gap-3 shadow-lg shadow-accent/20"
                  >
                    <div className="p-2 bg-white/20 rounded-lg text-white"><Cloud size={18}/></div>
                    Join the weave
                  </button>
                )}
              </div>
            </motion.div>
          </section>

          <div className="mb-10 flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Your Library</h3>
            </div>
            <div className="flex gap-2 p-1 bg-accent-soft border border-border rounded-xl">
              <button 
                onClick={() => setLibraryView('grid')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  libraryView === 'grid' ? "bg-white shadow-sm text-accent" : "text-text-sub hover:text-text-main"
                )}
              >
                Grid
              </button>
              <button 
                onClick={() => setLibraryView('list')}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  libraryView === 'list' ? "bg-white shadow-sm text-accent" : "text-text-sub hover:text-text-main"
                )}
              >
                List
              </button>
            </div>
          </div>

          {showLoginModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            >
              <div className="bg-white border border-border rounded-[2.5rem] p-10 shadow-2xl relative w-full max-w-md">
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-bg rounded-full transition-colors text-text-sub"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
                      <Cloud size={32} />
                   </div>
                   <h2 className="text-2xl font-bold tracking-tight">Sync Narrative</h2>
                   <p className="text-sm text-text-sub font-serif italic mt-2">Connect to the cloud to weave together.</p>
                </div>
                <AuthSection onAuthSuccess={() => setShowLoginModal(false)} />
              </div>
            </motion.div>
          )}

          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
            >
              <div className="bg-white border border-border rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden w-full max-w-2xl">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="absolute top-8 right-8 p-3 hover:bg-bg rounded-full transition-colors"
                >
                  <ArrowLeft size={24} className="rotate-90 md:rotate-0" />
                </button>
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <h3 className="text-3xl font-bold mb-10">Start a New Journey</h3>
                <div className="space-y-8">
                  <div className="group">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-text-sub mb-3 group-focus-within:text-primary transition-colors">Project Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. The Chronicles of Aethelgard"
                      className="w-full px-0 py-4 bg-transparent border-b-2 border-border focus:outline-none focus:border-primary transition-all text-2xl font-bold"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-text-sub mb-3 group-focus-within:text-primary transition-colors">Elevator Pitch</label>
                    <textarea 
                      value={newProjectPitch}
                      onChange={(e) => setNewProjectPitch(e.target.value)}
                      placeholder="In a world where magic is forbidden..."
                      className="w-full px-0 py-4 bg-transparent border-b-2 border-border focus:outline-none focus:border-primary h-32 resize-none transition-all text-lg font-serif italic"
                    />
                  </div>
                  <div className="flex justify-end gap-4 pt-6">
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="px-8 py-3.5 text-sm font-bold text-text-sub hover:bg-bg rounded-2xl transition-colors"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="px-10 py-3.5 bg-accent text-white text-sm font-bold rounded-2xl hover:bg-accent/90 transition-all disabled:opacity-50 shadow-lg"
                    >
                      Create Project
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {libraryView === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((project, idx) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8 }}
                  onClick={() => setActiveProjectId(project.id)}
                  className="group bg-white border border-border rounded-[2rem] p-8 hover:border-primary hover:shadow-high transition-all cursor-pointer flex flex-col h-[22rem] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-soft rounded-bl-[4rem] group-hover:bg-primary/5 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-main group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Book size={32} />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProjectId(project.id);
                      }}
                      className="p-3 text-text-sub hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors font-display leading-[1.1]">{project.name}</h3>
                    <p className="text-[15px] text-text-sub line-clamp-3 font-serif italic leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                      {project.elevatorPitch || "A story waiting to be told."}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-text-sub font-bold uppercase tracking-[0.2em] pt-6 mt-auto border-t border-border group-hover:border-primary/20 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary" />
                      <span>{project.characters.length} Cast</span>
                    </div>
                    <span className="ml-auto opacity-50">
                      {new Date(project.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {!isCreating && projects.length === 0 && (
                <div 
                  onClick={() => setIsCreating(true)}
                  className="col-span-full border-2 border-dashed border-border rounded-[2.5rem] p-32 flex flex-col items-center justify-center text-text-sub hover:border-primary hover:text-primary transition-all cursor-pointer bg-white/50"
                >
                  <div className="w-24 h-24 bg-accent-soft rounded-full flex items-center justify-center mb-6">
                    <Plus size={48} className="opacity-20" />
                  </div>
                  <p className="font-bold text-2xl tracking-tight">Your library is empty</p>
                  <p className="text-lg opacity-60 mt-2 font-serif italic">The first word is the hardest. Let's start together.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setActiveProjectId(project.id)}
                  className="group bg-white border border-border rounded-3xl p-6 hover:border-primary hover:shadow-high transition-all cursor-pointer flex items-center gap-6 relative overflow-hidden"
                >
                  <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-main group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                    <Book size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors font-display truncate pr-4">{project.name}</h3>
                    <p className="text-sm text-text-sub line-clamp-1 font-serif italic opacity-70 group-hover:opacity-100 transition-opacity">
                      {project.elevatorPitch || "A story waiting to be told."}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 text-[10px] text-text-sub font-bold uppercase tracking-widest ml-auto pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                      <span>{project.characters.length} Cast</span>
                    </div>
                    <span className="opacity-50 hidden sm:block">
                      {new Date(project.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProjectId(project.id);
                    }}
                    className="p-3 text-text-sub hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}

              {!isCreating && projects.length === 0 && (
                <div 
                  onClick={() => setIsCreating(true)}
                  className="border-2 border-dashed border-border rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-text-sub hover:border-primary hover:text-primary transition-all cursor-pointer bg-white/50"
                >
                  <p className="font-bold text-xl tracking-tight">Your library is empty</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#FDFDFD] text-text-main font-sans flex overflow-hidden relative"
    >
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarVisible(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Rail */}
      <AnimatePresence mode="popLayout">
        {isSidebarVisible && (
          <motion.aside 
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            exit={{ x: -100 }}
            className="fixed md:relative w-20 md:w-24 h-full bg-accent border-r border-accent/10 flex flex-col items-center py-8 shrink-0 z-50"
          >
            <div 
              onClick={() => setActiveProjectId(null)}
              className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-12 hover:bg-white/20 transition-all cursor-pointer rotate-3 shadow-lg"
            >
              <Book size={24} />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {[
                { id: 'Plot', label: 'Nodes', icon: LayoutDashboard },
                { id: 'Characters', label: 'Cast', icon: Users },
                { id: 'World', label: 'Lore', icon: Globe },
                { id: 'Cloud', label: 'Sync', icon: Cloud },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group relative",
                    activeTab === tab.id 
                      ? "bg-white text-accent shadow-xl" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute -right-12 bg-accent text-white px-2 py-1 rounded md:hidden pointer-events-none">
                    {tab.label}
                  </span>
                  <span className="hidden md:block text-[8px] font-bold uppercase tracking-wider">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
               <button 
                 onClick={() => setIsSidebarVisible(false)}
                 className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
               >
                 <ArrowLeft size={20} />
               </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Modern Inline Header */}
        <header className="h-20 border-b border-border px-8 flex justify-between items-center bg-white sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isSidebarVisible && (
              <button 
                onClick={() => setIsSidebarVisible(true)}
                className="p-3 bg-accent-soft border border-border rounded-xl text-accent hover:bg-accent hover:text-white transition-all mr-2"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary opacity-80">{activeTab}</span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-sub opacity-50">{activeProject?.name}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">
                {activeTab === 'Plot' ? 'Story Timeline' : 
                 activeTab === 'Characters' ? 'Cast & Relationships' : 
                 activeTab === 'World' ? 'Lore & Codex' : 'Cloud Connectivity'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 hover:bg-accent-soft rounded-2xl transition-colors cursor-default border border-transparent hover:border-border">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-sub">
                Auto-saved {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace Wrapper */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'Plot' && (
                <PlotTimeline 
                  project={activeProject} 
                  onUpdate={updateProject} 
                />
              )}
              {activeTab === 'Characters' && (
                <CharacterProfiles 
                  project={activeProject} 
                  onUpdate={updateProject} 
                />
              )}
              {activeTab === 'World' && (
                <WorldBuilding 
                  project={activeProject} 
                  onUpdate={updateProject} 
                />
              )}
              {activeTab === 'Cloud' && (
                <SupabaseDashboard />
              )}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Project Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingProjectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">Erase Project?</h3>
                <p className="text-sm text-text-sub mb-10 leading-relaxed">
                  This will permanently delete <strong>{projects.find(p => p.id === deletingProjectId)?.name}</strong> and all its narrative data. This cannot be undone.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => deleteProject(deletingProjectId)}
                    className="w-full py-5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98]"
                  >
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setDeletingProjectId(null)}
                    className="w-full py-5 bg-bg text-text-sub font-bold rounded-2xl hover:bg-border transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

