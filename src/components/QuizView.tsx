import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuizQuestions } from '@/data/flashcards';
import { CheckCircle2, XCircle, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDynamicQuestions } from '@/hooks/useDynamicQuestions';
import { useWebhookGenerate } from '@/hooks/useWebhookGenerate';

interface QuizViewProps {
  moduleFilter?: string;
  questionCount?: number;
  userId: string;
  onProgressUpdate?: () => void;
}

interface QuizQuestion {
  id: string | number;
  question: string;
  options: string[];
  correctIndex: number;
  module: string;
  difficulty: string;
  explanation?: string | null;
}

export function QuizView({ moduleFilter, questionCount = 10, userId, onProgressUpdate }: QuizViewProps) {
    const { generate, generating } = useWebhookGenerate();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [webhookAttempted, setWebhookAttempted] = useState(false);

  useEffect(() => {
    if (!webhookAttempted && moduleFilter) {
      setWebhookAttempted(true);
      generateViaWebhook(moduleFilter);
    } else if (!moduleFilter) {
      // Fallback if no module
      const staticQuestions: QuizQuestion[] = getQuizQuestions(questionCount, moduleFilter).map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        module: q.module,
        difficulty: q.difficulty,
      }));
      setQuestions(staticQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount));
    }
  }, [questionCount, moduleFilter, webhookAttempted]);

  const generateViaWebhook = async (mod: string) => {
    const result = await generate({
      contentType: 'quiz',
      moduleName: mod,
      count: questionCount,
    });

    if (result?.questions && Array.isArray(result.questions)) {
      const webhookQuestions: QuizQuestion[] = result.questions.map((q: any, i: number) => ({
        id: `webhook-${i}`,
        question: q.question || q.question_text,
        options: q.options || [],
        correctIndex: q.correctIndex ?? q.correct_index ?? 0,
        module: mod,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || null,
      }));
      setQuestions(webhookQuestions.slice(0, questionCount));
    } else {
      // Fallback to whatever we have
      const staticQuestions: QuizQuestion[] = getQuizQuestions(questionCount, moduleFilter).map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        module: q.module,
        difficulty: q.difficulty,
      }));
      setQuestions(staticQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount));
    }
  };

  const question = questions[currentIndex];

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === question.correctIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
  }, [selectedIndex, question]);

  const saveQuizResult = async (finalScore: number) => {
    const percentage = Math.round((finalScore / questions.length) * 100);
    const pointsEarned = finalScore * 15;

    await supabase.from('quiz_results').insert({
      user_id: userId,
      module: moduleFilter || null,
      score: finalScore,
      total: questions.length,
      percentage,
      points_earned: pointsEarned,
    });

    const { data: prof } = await supabase.from('profiles')
      .select('quizzes_completed, total_points')
      .eq('user_id', userId)
      .single();

    if (prof) {
      await supabase.from('profiles').update({
        quizzes_completed: prof.quizzes_completed + 1,
        total_points: prof.total_points + pointsEarned,
      }).eq('user_id', userId);
    }

    onProgressUpdate?.();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedIndex(null);
      setFeedback(null);
    } else {
      setIsFinished(true);
      saveQuizResult(score);
    }
  };

  if (generating || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-muted-foreground">
          {generating ? 'Gerando questões com IA...' : 'Carregando quiz...'}
        </div>
        {generating && (
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            A IA está analisando o módulo e criando questões personalizadas. Isso pode levar alguns segundos.
          </p>
        )}
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-12">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-semibold text-foreground">Quiz Finalizado!</h2>
        <div className="text-center">
          <p className="text-5xl font-bold font-mono-data text-primary">{percentage}%</p>
          <p className="text-muted-foreground mt-2">{score} de {questions.length} corretas</p>
          <p className="text-sm text-accent mt-1">+{score * 15} pontos</p>
        </div>
        <button
          onClick={() => { setCurrentIndex(0); setSelectedIndex(null); setFeedback(null); setScore(0); setIsFinished(false); setWebhookAttempted(false); }}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-card-hover transition-all"
        >
          Tentar Novamente
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono-data text-muted-foreground">{currentIndex + 1}/{questions.length}</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-mono-data text-accent">{score} pts</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-card rounded-2xl shadow-card p-8">
          <h3 className="text-lg font-semibold text-foreground mb-6">{question.question}</h3>
          <div className="flex flex-col gap-3">
            {question.options.map((option, i) => {
              let optionStyle = 'bg-secondary text-secondary-foreground hover:shadow-card-hover';
              if (selectedIndex !== null) {
                if (i === question.correctIndex) optionStyle = 'bg-success-light text-foreground ring-2 ring-accent';
                else if (i === selectedIndex) optionStyle = 'bg-error-light text-foreground ring-2 ring-destructive animate-shake';
                else optionStyle = 'bg-secondary text-muted-foreground opacity-50';
              }
              return (
                <motion.button key={i} onClick={() => handleSelect(i)} disabled={selectedIndex !== null} whileTap={selectedIndex === null ? { scale: 0.98 } : {}} className={`w-full text-left px-5 py-4 rounded-xl transition-all text-sm leading-relaxed ${optionStyle}`}>
                  <span className="font-mono-data text-xs text-muted-foreground mr-3">{String.fromCharCode(65 + i)}</span>
                  {option.length > 120 ? option.substring(0, 120) + '...' : option}
                </motion.button>
              );
            })}
          </div>

          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 flex flex-col gap-2 p-4 rounded-xl ${feedback === 'correct' ? 'bg-success-light' : 'bg-error-light'}`}>
              <div className="flex items-center gap-3">
                {feedback === 'correct' ? <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                <span className="text-sm text-foreground">{feedback === 'correct' ? 'Correto! Muito bem!' : 'Incorreto.'}</span>
                <button onClick={handleNext} className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  {currentIndex < questions.length - 1 ? 'Próxima' : 'Resultado'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {question.explanation && (
                <p className="text-xs text-muted-foreground mt-1 pl-8">{question.explanation}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
