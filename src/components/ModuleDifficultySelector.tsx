import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, GraduationCap, Search, Filter } from 'lucide-react';
import { useStudyModules } from '@/hooks/useStudyModules';

interface ModuleDifficultySelectorProps {
  title: string;
  icon: React.ReactNode;
  onSelect: (modules: string[], difficulty: string) => void;
}

const DIFFICULTIES = [
  { value: 'all', label: 'Todos', color: 'bg-secondary text-foreground' },
  { value: 'easy', label: 'Fácil', color: 'bg-accent/10 text-accent' },
  { value: 'medium', label: 'Médio', color: 'bg-warning/10 text-warning' },
  { value: 'hard', label: 'Difícil', color: 'bg-destructive/10 text-destructive' },
];

const colorMap: Record<string, string> = {
  primary: 'border-primary bg-primary/10 text-primary',
  accent: 'border-accent bg-accent/10 text-accent',
  warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
  destructive: 'border-destructive bg-destructive/10 text-destructive',
};

const colorMapInactive: Record<string, string> = {
  primary: 'border-border hover:border-primary/50',
  accent: 'border-border hover:border-accent/50',
  warning: 'border-border hover:border-yellow-500/50',
  destructive: 'border-border hover:border-destructive/50',
};

export function ModuleDifficultySelector({ title, icon, onSelect }: ModuleDifficultySelectorProps) {
  const { modules, loading } = useStudyModules();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('all');

  const toggleModule = (name: string) => {
    setSelectedModules(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleStart = () => {
    onSelect(selectedModules, difficulty);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando módulos...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          {icon}
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">Selecione os módulos e a dificuldade</p>
      </div>

      {/* Module Selection */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Módulos
          {selectedModules.length === 0 && (
            <span className="text-xs text-muted-foreground">(todos selecionados)</span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          {modules.map(mod => {
            const isSelected = selectedModules.includes(mod.name);
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.name)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? colorMap[mod.color] || colorMap.primary
                    : colorMapInactive[mod.color] || colorMapInactive.primary
                }`}
              >
                {mod.name}
              </button>
            );
          })}
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado pelo admin</p>
          )}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="text-sm font-medium text-foreground mb-3">Dificuldade</h3>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                difficulty === d.value
                  ? `${d.color} border-current`
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
      >
        Começar
      </motion.button>
    </div>
  );
}
