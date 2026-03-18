import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Brain, Trophy, ArrowLeft, Menu, X } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { FlashcardView } from '@/components/FlashcardView';
import { QuizView } from '@/components/QuizView';
import { Leaderboard } from '@/components/Leaderboard';
import { flashcards } from '@/data/flashcards';

type View = 'dashboard' | 'flashcards' | 'quiz' | 'leaderboard';

const navItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
  { id: 'flashcards' as View, label: 'Flashcards', icon: BookOpen },
  { id: 'quiz' as View, label: 'Quiz', icon: Brain },
  { id: 'leaderboard' as View, label: 'Ranking', icon: Trophy },
];

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ cardsReviewed: 0, quizScore: 85, streak: 3 });

  const filteredCards = useMemo(() => {
    if (!moduleFilter) return flashcards;
    return flashcards.filter(c => c.module === moduleFilter);
  }, [moduleFilter]);

  const handleNavigate = (view: string, module?: string) => {
    setCurrentView(view as View);
    setModuleFilter(module);
    setMobileMenuOpen(false);
  };

  const handleRate = (_cardId: number, _rating: 'easy' | 'medium' | 'hard') => {
    setStats(prev => ({ ...prev, cardsReviewed: prev.cardsReviewed + 1 }));
  };

  const handleQuizComplete = (score: number, total: number) => {
    setStats(prev => ({
      ...prev,
      quizScore: Math.round((score / total) * 100),
    }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;
      case 'flashcards':
        return <FlashcardView cards={filteredCards} onRate={handleRate} />;
      case 'quiz':
        return <QuizView moduleFilter={moduleFilter} onComplete={handleQuizComplete} />;
      case 'leaderboard':
        return <Leaderboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl shadow-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' && (
              <button
                onClick={() => { setCurrentView('dashboard'); setModuleFilter(undefined); }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Bio<span className="text-primary">Core</span>
            </h1>
          </div>

          {/* Desktop nav */}
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
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Module filter indicator */}
      {moduleFilter && currentView === 'flashcards' && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Módulo:</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {moduleFilter}
            </span>
            <button
              onClick={() => setModuleFilter(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              × Limpar
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (moduleFilter || '')}
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
