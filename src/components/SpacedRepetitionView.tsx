import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard, flashcards } from '@/data/flashcards';
import { RotateCcw, Brain, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sm2, ratingToQuality, SM2State } from '@/lib/sm2';

interface Props {
  userId: string;
  onProgressUpdate?: () => void;
}

interface CardProgress {
  card_id: number;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  difficulty: string;
}

export function SpacedRepetitionView({ userId, onProgressUpdate }: Props) {
  const [progress, setProgress] = useState<CardProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('card_progress')
      .select('card_id, easiness_factor, interval_days, repetitions, next_review_at, difficulty')
      .eq('user_id', userId);
    setProgress(data || []);
    setLoading(false);
  };

  const dueCards = useMemo(() => {
    const now = new Date();
    const progressMap = new Map(progress.map(p => [p.card_id, p]));

    // Cards never studied + cards due for review
    const due: { card: Flashcard; prog: CardProgress | null; priority: number }[] = [];

    for (const card of flashcards) {
      const p = progressMap.get(card.id);
      if (!p) {
        // Never studied — high priority
        due.push({ card, prog: null, priority: 100 });
      } else if (new Date(p.next_review_at) <= now) {
        // Due for review — priority by how overdue + low easiness
        const overdueDays = (now.getTime() - new Date(p.next_review_at).getTime()) / 86400000;
        const priority = overdueDays + (3 - p.easiness_factor) * 10;
        due.push({ card, prog: p, priority });
      }
    }

    // Sort: highest priority first (hardest/most overdue)
    due.sort((a, b) => b.priority - a.priority);

    // Limit session to 20 cards
    return due.slice(0, 20);
  }, [progress]);

  const handleRate = async (rating: 'easy' | 'medium' | 'hard') => {
    const item = dueCards[currentIndex];
    if (!item) return;

    const quality = ratingToQuality(rating);
    const prev = item.prog || { easiness_factor: 2.5, interval_days: 0, repetitions: 0 };
    const newState: SM2State = sm2(quality, prev);

    await supabase.from('card_progress').upsert(
      {
        user_id: userId,
        card_id: item.card.id,
        difficulty: rating,
        last_reviewed_at: new Date().toISOString(),
        easiness_factor: newState.easiness_factor,
        interval_days: newState.interval_days,
        repetitions: newState.repetitions,
        next_review_at: newState.next_review_at,
      },
      { onConflict: 'user_id,card_id' }
    );

    // Update profile stats
    const today = new Date().toISOString().split('T')[0];
    const { data: prof } = await supabase
      .from('profiles')
      .select('cards_reviewed, total_points, current_streak, best_streak, last_study_date')
      .eq('user_id', userId)
      .single();

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

    if (currentIndex < dueCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(i => i + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Analisando progresso...</div>
      </div>
    );
  }

  if (dueCards.length === 0 || sessionComplete) {
    const totalStudied = progress.length;
    const masteredCount = progress.filter(p => p.repetitions >= 3 && p.easiness_factor >= 2.5).length;

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 max-w-md mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">
          {sessionComplete ? 'Sessão completa!' : 'Tudo em dia!'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {sessionComplete
            ? `Você revisou ${dueCards.length} cards nesta sessão. Volte mais tarde para reforçar a memória.`
            : 'Não há cards para revisar agora. O algoritmo SM-2 agendará as próximas revisões automaticamente.'}
        </p>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-card rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-semibold font-mono-data text-foreground">{totalStudied}</p>
            <p className="text-xs text-muted-foreground">Cards estudados</p>
          </div>
          <div className="bg-card rounded-xl shadow-card p-4 text-center">
            <p className="text-2xl font-semibold font-mono-data text-accent">{masteredCount}</p>
            <p className="text-xs text-muted-foreground">Dominados</p>
          </div>
        </div>
      </div>
    );
  }

  const item = dueCards[currentIndex];
  const card = item.card;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Revisão Espaçada</span>
        </div>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground font-mono-data">
          {currentIndex + 1}/{dueCards.length}
        </span>
      </div>

      {/* Priority indicator */}
      <div className="flex items-center gap-2 w-full">
        {item.prog ? (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <Clock className="w-3.5 h-3.5" />
            <span>Revisão pendente — intervalo: {item.prog.interval_days}d</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Card novo — primeira vez</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[3/2] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full h-full"
        >
          <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden border-2 border-primary/20">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Pergunta</span>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">{card.front}</h2>
            <span className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Toque para virar
            </span>
          </div>

          <div className="absolute inset-0 bg-card rounded-2xl shadow-card p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 border-2 border-accent/20">
            <span className="text-xs text-accent uppercase tracking-widest mb-4">Resposta</span>
            <p className="text-base md:text-lg text-foreground leading-relaxed">{card.back}</p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          <button
            onClick={() => handleRate('hard')}
            className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:shadow-card-hover transition-all"
          >
            Difícil
          </button>
          <button
            onClick={() => handleRate('medium')}
            className="px-5 py-2.5 rounded-lg bg-warning text-warning-foreground text-sm font-medium hover:shadow-card-hover transition-all"
          >
            Médio
          </button>
          <button
            onClick={() => handleRate('easy')}
            className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:shadow-card-hover transition-all"
          >
            Fácil
          </button>
        </motion.div>
      )}

      {/* SM-2 info */}
      <p className="text-xs text-muted-foreground text-center max-w-sm">
        O algoritmo SM-2 ajusta automaticamente os intervalos de revisão. Cards difíceis aparecem com mais frequência.
      </p>
    </div>
  );
}
