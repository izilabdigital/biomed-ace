import { motion } from 'framer-motion';
import { BookOpen, Brain, GraduationCap } from 'lucide-react';
import { useStudyModules } from '@/hooks/useStudyModules';

const colorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  warning: 'bg-yellow-500/10 text-yellow-600',
  destructive: 'bg-destructive/10 text-destructive',
};

const colorBorder: Record<string, string> = {
  primary: 'border-primary/20',
  accent: 'border-accent/20',
  warning: 'border-yellow-500/20',
  destructive: 'border-destructive/20',
};

interface DashboardProps {
  onNavigate: (view: string, module?: string) => void;
  stats: { cardsReviewed: number; quizScore: number; streak: number; totalPoints: number };
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { modules, loading } = useStudyModules();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando módulos...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-4">Módulos de Estudo</h2>
      {modules.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum módulo de estudo cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">O administrador precisa adicionar módulos no painel admin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-xl shadow-card border ${colorBorder[mod.color] || 'border-border'} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${colorMap[mod.color] || colorMap.primary}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{mod.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('flashcards', mod.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Flashcards
                  </button>
                  <button
                    onClick={() => onNavigate('quiz', mod.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    Quiz
                  </button>
                  <button
                    onClick={() => onNavigate('exam', mod.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Prova
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
