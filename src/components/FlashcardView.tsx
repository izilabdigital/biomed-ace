import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard } from '@/data/flashcards';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sm2, ratingToQuality } from '@/lib/sm2';

import { useWebhookGenerate } from '@/hooks/useWebhookGenerate';
import { Loader2 } from 'lucide-react';

interface FlashcardViewProps {
  moduleFilter?: string;
  userId: string;
  onProgressUpdate?: () => void;
}

export function FlashcardView({ moduleFilter, userId, onProgressUpdate }: FlashcardViewProps) {
  const { generate, generating } = useWebhookGenerate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const fetchCards = async () => {
      // Simulate fetch or fallback if no module selected
      if (!moduleFilter) {
        setLoading(false);
        return;
      }
      
      const result = await generate({
        contentType: 'flashcards',
        moduleName: moduleFilter,
        count: 10,
      });

      if (result?.flashcards && Array.isArray(result.flashcards)) {
        const webhookCards: Flashcard[] = result.flashcards.map((c: any, i: number) => ({
          id: `webhook-card-${i}`,
          front: c.front,
          back: c.back,
          module: moduleFilter,
          moduleColor: c.moduleColor || 'primary',
          difficulty: c.difficulty || 'medium',
        }));
        setCards(webhookCards);
      }
      setLoading(false);
    };

    fetchCards();
  }, [moduleFilter]);

  if (generating || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-muted-foreground">Gerando flashcards com IA...</div>
      </div>
    );
  }

  const card = cards[currentIndex];
  if (!card) return (
    <div className="text-center py-12 text-muted-foreground">
      Nenhum flashcard disponível para este módulo.
    </div>
  );

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

  const handleRate = async (rating: 'easy' | 'medium' | 'hard') => {
    const quality = ratingToQuality(rating);
    // Fetch existing progress for SM-2
    const { data: existing } = await supabase
      .from('card_progress')
      .select('easiness_factor, interval_days, repetitions')
      .eq('user_id', userId)
      .eq('card_id', card.id)
      .maybeSingle();

    const prev = existing || { easiness_factor: 2.5, interval_days: 0, repetitions: 0 };
    const newState = sm2(quality, prev);

    // Upsert card progress with SM-2 fields
    await supabase.from('card_progress').upsert(
      {
        user_id: userId,
        card_id: card.id,
        difficulty: rating,
        last_reviewed_at: new Date().toISOString(),
        easiness_factor: newState.easiness_factor,
        interval_days: newState.interval_days,
        repetitions: newState.repetitions,
        next_review_at: newState.next_review_at,
      },
      { onConflict: 'user_id,card_id' }
    );

    // Simple increment via direct update
    const today = new Date().toISOString().split('T')[0];
    const { data: prof } = await supabase.from('profiles').select('cards_reviewed, total_points, current_streak, best_streak, last_study_date').eq('user_id', userId).single();
    if (prof) {
      const points = rating === 'easy' ? 10 : rating === 'medium' ? 20 : 30;
      let newStreak = prof.current_streak;
      const lastDate = prof.last_study_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate !== today) {
        newStreak = lastDate === yesterday ? prof.current_streak + 1 : 1;
      }
      await supabase.from('profiles').update({
        cards_reviewed: prof.cards_reviewed + 1,
        total_points: prof.total_points + points,
        current_streak: newStreak,
        best_streak: Math.max(prof.best_streak, newStreak),
        last_study_date: today,
      }).eq('user_id', userId);
    }

    onProgressUpdate?.();
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
              <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden">
                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Pergunta</span>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">{card.front}</h2>
                <span className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Toque para virar
                </span>
              </div>

              <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                <span className="text-xs text-accent uppercase tracking-widest mb-4">Resposta</span>
                <p className="text-base md:text-lg text-foreground leading-relaxed">{card.back}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 hover:shadow-card-hover transition-shadow"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {isFlipped && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
            <button onClick={() => handleRate('easy')} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:shadow-card-hover transition-all">Fácil</button>
            <button onClick={() => handleRate('medium')} className="px-4 py-2 rounded-lg bg-warning text-warning-foreground text-sm font-medium hover:shadow-card-hover transition-all">Médio</button>
            <button onClick={() => handleRate('hard')} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:shadow-card-hover transition-all">Difícil</button>
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
