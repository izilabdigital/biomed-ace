import { motion } from 'framer-motion';
import { BookOpen, Brain, Trophy, Layers, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { modules } from '@/data/flashcards';
import moduleAnatomia from '@/assets/module-anatomia.jpg';
import moduleEsqueletico from '@/assets/module-esqueletico.jpg';
import moduleOrganicos from '@/assets/module-organicos.jpg';
import moduleClinica from '@/assets/module-clinica.jpg';
import moduleCelular from '@/assets/module-celular.jpg';

const moduleImages: Record<string, string> = {
  'Introdução à Anatomia': moduleAnatomia,
  'Sistema Esquelético': moduleEsqueletico,
  'Sistemas Orgânicos': moduleOrganicos,
  'Biomedicina Clínica': moduleClinica,
  'Biologia Celular': moduleCelular,
};

interface DashboardProps {
  onNavigate: (view: string, module?: string) => void;
  stats: { cardsReviewed: number; quizScore: number; streak: number; totalPoints: number };
}

export function Dashboard({ onNavigate, stats }: DashboardProps) {
  const statCards = [
    { label: 'Cards Revisados', value: stats.cardsReviewed, icon: Layers, color: 'text-primary' },
    { label: 'Precisão Quiz', value: `${stats.quizScore}%`, icon: TrendingUp, color: 'text-accent' },
    { label: 'Sequência', value: `${stats.streak} dias`, icon: Zap, color: 'text-warning' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl shadow-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold font-mono-data text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.button
          onClick={() => onNavigate('flashcards')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-card rounded-2xl shadow-card p-6 text-left hover:shadow-card-hover transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Flashcards</h3>
          <p className="text-sm text-muted-foreground mt-1">Revise 100 cards de Biomedicina</p>
        </motion.button>

        <motion.button
          onClick={() => onNavigate('spaced')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-card rounded-2xl shadow-card p-6 text-left hover:shadow-card-hover transition-shadow group border-2 border-primary/20"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Revisão Espaçada</h3>
          <p className="text-sm text-muted-foreground mt-1">SM-2 prioriza cards difíceis</p>
        </motion.button>

        <motion.button
          onClick={() => onNavigate('quiz')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-card rounded-2xl shadow-card p-6 text-left hover:shadow-card-hover transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Quiz de Fixação</h3>
          <p className="text-sm text-muted-foreground mt-1">Teste seus conhecimentos</p>
        </motion.button>
      </div>

      {/* Modules with images */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Módulos de Estudo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => {
            const colorMap: Record<string, string> = {
              primary: 'bg-primary/10 text-primary',
              accent: 'bg-accent/10 text-accent',
              warning: 'bg-warning/10 text-warning',
              destructive: 'bg-destructive/10 text-destructive',
            };
            const img = moduleImages[mod.name];
            return (
              <motion.button
                key={mod.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => onNavigate('flashcards', mod.name)}
                className="relative overflow-hidden bg-card rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left group"
              >
                {img && (
                  <div className="h-28 overflow-hidden">
                    <img
                      src={img}
                      alt={mod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 h-28 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  </div>
                )}
                <div className="flex items-center gap-4 p-4 relative">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${colorMap[mod.color]}`}>
                    {mod.count}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.count} flashcards</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard shortcut */}
      <motion.button
        onClick={() => onNavigate('leaderboard')}
        whileHover={{ y: -2 }}
        className="w-full bg-card rounded-2xl shadow-card p-6 flex items-center gap-4 hover:shadow-card-hover transition-shadow"
      >
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-warning" />
        </div>
        <div className="text-left">
          <h3 className="text-base font-semibold text-foreground">Ranking</h3>
          <p className="text-sm text-muted-foreground">Veja sua posição no leaderboard</p>
        </div>
      </motion.button>
    </div>
  );
}
