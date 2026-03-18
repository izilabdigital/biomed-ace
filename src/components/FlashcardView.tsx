import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard } from '@/data/flashcards';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface FlashcardViewProps {
  cards: Flashcard[];
  onRate?: (cardId: number, rating: 'easy' | 'medium' | 'hard') => void;
}

export function FlashcardView({ cards, onRate }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const card = cards[currentIndex];
  if (!card) return null;

  const next = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex(i => i + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex(i => i - 1);
    }
  };

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    onRate?.(card.id, rating);
    next();
  };

  const moduleColorMap: Record<string, string> = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-sm text-muted-foreground font-mono-data">
          {currentIndex + 1}/{cards.length}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full text-primary-foreground ${moduleColorMap[card.moduleColor] || 'bg-primary'}`}>
          {card.module}
        </span>
      </div>

      {/* Card */}
      <div className="relative w-full aspect-[3/2] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 100 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full h-full"
            >
              {/* Front */}
              <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden">
                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Pergunta</span>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">{card.front}</h2>
                <span className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Toque para virar
                </span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                <span className="text-xs text-accent uppercase tracking-widest mb-4">Resposta</span>
                <p className="text-base md:text-lg text-foreground leading-relaxed">{card.back}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 hover:shadow-card-hover transition-shadow"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <button onClick={() => handleRate('easy')} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:shadow-card-hover transition-all">
              Fácil
            </button>
            <button onClick={() => handleRate('medium')} className="px-4 py-2 rounded-lg bg-warning text-warning-foreground text-sm font-medium hover:shadow-card-hover transition-all">
              Médio
            </button>
            <button onClick={() => handleRate('hard')} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:shadow-card-hover transition-all">
              Difícil
            </button>
          </motion.div>
        )}

        <button
          onClick={next}
          disabled={currentIndex === cards.length - 1}
          className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 hover:shadow-card-hover transition-shadow"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
