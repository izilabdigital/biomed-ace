import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Brain, Trophy, ArrowLeft, Menu, X, User, GraduationCap, Shield, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AdminPanel } from '@/components/AdminPanel';
import Auth from './Auth';
import { Dashboard } from '@/components/Dashboard';
import { FlashcardView } from '@/components/FlashcardView';
import { QuizView } from '@/components/QuizView';
import { Leaderboard } from '@/components/Leaderboard';
import { ExamSimulator } from '@/components/ExamSimulator';
import { WordSearchGame } from '@/components/WordSearchGame';
import { ModuleDifficultySelector } from '@/components/ModuleDifficultySelector';
import { useDynamicFlashcards } from '@/hooks/useDynamicFlashcards';

type View = 'dashboard' | 'flashcards' | 'quiz' | 'leaderboard' | 'exam' | 'profile' | 'admin' | 'wordsearch';

const navItems = [
  { id: 'dashboard' as View, label: 'Início', icon: Home },
  { id: 'flashcards' as View, label: 'Flashcards', icon: BookOpen },
  { id: 'quiz' as View, label: 'Quiz', icon: Brain },
  { id: 'exam' as View, label: 'Prova', icon: GraduationCap },
  { id: 'wordsearch' as View, label: 'Caça-Palavras', icon: Search },
  { id: 'leaderboard' as View, label: 'Ranking', icon: Trophy },
  { id: 'profile' as View, label: 'Perfil', icon: User },
];

const Index = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const { allCards } = useDynamicFlashcards();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showSelector, setShowSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('biocore-theme') === 'dark' ||
        (!localStorage.getItem('biocore-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('biocore-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const filteredCards = useMemo(() => {
    let cards = allCards;
    if (moduleFilter) cards = cards.filter(c => c.module === moduleFilter);
    if (difficultyFilter !== 'all') cards = cards.filter(c => c.difficulty === difficultyFilter);
    return cards;
  }, [moduleFilter, difficultyFilter, allCards]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  const handleNavigate = (view: string, module?: string) => {
    const v = view as View;
    setCurrentView(v);
    setMobileMenuOpen(false);

    if (module) {
      // Direct navigation from dashboard with module pre-selected
      setModuleFilter(module);
      setDifficultyFilter('all');
      setShowSelector(false);
    } else if (['flashcards', 'quiz', 'exam', 'wordsearch'].includes(v)) {
      // Navigation from menu - show selector
      setModuleFilter(undefined);
      setDifficultyFilter('all');
      setShowSelector(true);
    } else {
      setModuleFilter(undefined);
      setShowSelector(false);
    }
  };

  const handleSelectorConfirm = (modules: string[], difficulty: string) => {
    // If no modules selected, show all (no filter)
    setModuleFilter(modules.length === 1 ? modules[0] : undefined);
    setDifficultyFilter(difficulty);
    setShowSelector(false);
  };

  const stats = {
    cardsReviewed: profile?.cards_reviewed ?? 0,
    quizScore: 0,
    streak: profile?.current_streak ?? 0,
    totalPoints: profile?.total_points ?? 0,
  };

  const selectorTitles: Record<string, { title: string; icon: React.ReactNode }> = {
    flashcards: { title: 'Flashcards', icon: <BookOpen className="w-6 h-6 text-primary" /> },
    quiz: { title: 'Quiz', icon: <Brain className="w-6 h-6 text-accent" /> },
    exam: { title: 'Prova', icon: <GraduationCap className="w-6 h-6 text-destructive" /> },
    wordsearch: { title: 'Caça-Palavras', icon: <Search className="w-6 h-6 text-primary" /> },
  };

  const renderView = () => {
    // Show selector if needed
    if (showSelector && selectorTitles[currentView]) {
      const s = selectorTitles[currentView];
      return <ModuleDifficultySelector title={s.title} icon={s.icon} onSelect={handleSelectorConfirm} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;
      case 'flashcards':
        return <FlashcardView cards={filteredCards} userId={user.id} moduleFilter={moduleFilter} onProgressUpdate={refreshProfile} />;
      case 'quiz':
        return <QuizView moduleFilter={moduleFilter} userId={user.id} onProgressUpdate={refreshProfile} />;
      case 'exam':
        return <ExamSimulator moduleFilter={moduleFilter} userId={user.id} onProgressUpdate={refreshProfile} />;
      case 'leaderboard':
        return <Leaderboard currentUserId={user.id} />;
      case 'profile':
        return <SettingsPanel darkMode={darkMode} onToggleDarkMode={() => setDarkMode(d => !d)} />;
      case 'wordsearch':
        return <WordSearchGame moduleFilter={moduleFilter} />;
      case 'admin':
        return <AdminPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl shadow-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' && (
              <button
                onClick={() => { setCurrentView('dashboard'); setModuleFilter(undefined); setShowSelector(false); }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Bio<span className="text-primary">Core</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentView === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => handleNavigate('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentView === 'admin'
                    ? 'bg-destructive/10 text-destructive font-medium'
                    : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="px-4 py-2 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      currentView === item.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => handleNavigate('admin')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      currentView === 'admin'
                        ? 'bg-destructive/10 text-destructive font-medium'
                        : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {moduleFilter && !showSelector && ['flashcards', 'quiz', 'exam', 'wordsearch'].includes(currentView) && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Módulo:</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{moduleFilter}</span>
            {difficultyFilter !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">{difficultyFilter}</span>
            )}
            <button onClick={() => setShowSelector(true)} className="text-xs text-muted-foreground hover:text-foreground">
              ✎ Alterar
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (moduleFilter || '') + (showSelector ? 'sel' : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
