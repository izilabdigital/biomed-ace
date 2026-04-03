import { motion } from 'framer-motion';
import { useDynamicFlashcards } from '@/hooks/useDynamicFlashcards';
import moduleAnatomia from '@/assets/module-anatomia.jpg';
import moduleEsqueletico from '@/assets/module-esqueletico.jpg';
import moduleOrganicos from '@/assets/module-organicos.jpg';
import moduleClinica from '@/assets/module-clinica.jpg';
import moduleCelular from '@/assets/module-celular.jpg';
import moduleArticular from '@/assets/module-articular.jpg';

const moduleImages: Record<string, string> = {
  'Introdução à Anatomia': moduleAnatomia,
  'Sistema Esquelético': moduleEsqueletico,
  'Sistema Articular': moduleArticular,
  'Sistemas Orgânicos': moduleOrganicos,
  'Biomedicina Clínica': moduleClinica,
  'Biologia Celular': moduleCelular,
};

interface DashboardProps {
  onNavigate: (view: string, module?: string) => void;
  stats: { cardsReviewed: number; quizScore: number; streak: number; totalPoints: number };
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { allModules } = useDynamicFlashcards();

  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-4">Módulos de Estudo</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allModules.map((mod, i) => {
          const img = moduleImages[mod.name];
          return (
            <motion.button
              key={mod.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
  );
}
