import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuizQuestions } from '@/data/flashcards';
import { CheckCircle2, XCircle, Trophy, ArrowRight, Clock, Flame, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExamSimulatorProps {
  moduleFilter?: string;
  userId: string;
  onProgressUpdate?: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

const difficultyConfig = {
  easy: { label: 'Fácil', icon: Zap, questions: 15, timeMinutes: 15, color: 'text-accent', bg: 'bg-accent/10', points: 10 },
  medium: { label: 'Médio', icon: Flame, questions: 20, timeMinutes: 20, color: 'text-primary', bg: 'bg-primary/10', points: 15 },
  hard: { label: 'Difícil', icon: AlertTriangle, questions: 30, timeMinutes: 25, color: 'text-destructive', bg: 'bg-destructive/10', points: 20 },
  all: { label: 'Simulado ENADE', icon: Trophy, questions: 30, timeMinutes: 30, color: 'text-foreground', bg: 'bg-secondary', points: 15 },
};

// Map modules to relevant image search terms for generating contextual quiz images
const moduleImagePrompts: Record<string, string[]> = {
  'Introdução à Anatomia': ['human anatomy diagram', 'anatomical planes illustration', 'body regions medical', 'anatomical position drawing'],
  'Sistema Esquelético': ['skeleton anatomy', 'bone structure diagram', 'skull anatomy', 'spine vertebrae illustration'],
  'Sistemas Orgânicos': ['organ systems diagram', 'digestive system', 'circulatory system', 'respiratory anatomy'],
  'Biomedicina Clínica': ['clinical laboratory', 'blood analysis microscope', 'medical diagnosis', 'clinical pathology'],
  'Biologia Celular': ['cell structure diagram', 'organelles illustration', 'cell membrane transport', 'mitochondria diagram'],
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ExamSimulator({ moduleFilter, userId, onProgressUpdate }: ExamSimulatorProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questions, setQuestions] = useState<ReturnType<typeof getQuizQuestions>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [answers, setAnswers] = useState<('correct' | 'wrong' | 'skipped')[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (!isStarted || isFinished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, isFinished]);

  const startExam = (diff: Difficulty) => {
    const config = difficultyConfig[diff];
    let filteredQuestions: ReturnType<typeof getQuizQuestions>;

    if (diff === 'all') {
      filteredQuestions = getQuizQuestions(config.questions, moduleFilter);
    } else {
      // Get questions of specified difficulty
      const allQ = getQuizQuestions(config.questions * 3, moduleFilter);
      filteredQuestions = allQ.filter(q => q.difficulty === diff).slice(0, config.questions);
      // Pad with random if not enough
      if (filteredQuestions.length < config.questions) {
        const remaining = allQ.filter(q => !filteredQuestions.find(f => f.id === q.id));
        filteredQuestions = [...filteredQuestions, ...remaining.slice(0, config.questions - filteredQuestions.length)];
      }
    }

    setDifficulty(diff);
    setQuestions(filteredQuestions);
    setTimeLeft(config.timeMinutes * 60);
    setIsStarted(true);
    setAnswers(new Array(filteredQuestions.length).fill('skipped'));
  };

  const finishExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    const config = difficultyConfig[difficulty || 'all'];
    const pointsEarned = score * config.points;
    const percentage = Math.round((score / questions.length) * 100);

    await supabase.from('quiz_results').insert({
      user_id: userId,
      module: moduleFilter || 'Simulado',
      score,
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
  }, [score, questions.length, difficulty, moduleFilter, userId, onProgressUpdate]);

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === questions[currentIndex].correctIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentIndex] = isCorrect ? 'correct' : 'wrong';
      return copy;
    });
  }, [selectedIndex, currentIndex, questions]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedIndex(null);
      setFeedback(null);
    } else {
      finishExam();
    }
  };

  // Question image based on module
  const getQuestionImage = (q: typeof questions[0]) => {
    const prompts = moduleImagePrompts[q.module] || moduleImagePrompts['Introdução à Anatomia'];
    const idx = q.id % prompts.length;
    return prompts[idx];
  };

  // Difficulty selection screen
  if (!isStarted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Modo Prova</h2>
          <p className="text-muted-foreground mt-2">Simulado cronometrado com nota final</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([key, config]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startExam(key)}
              className={`p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all text-left border border-border`}
            >
              <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
                <config.icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{config.label}</h3>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" />
                  {config.questions} questões
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {config.timeMinutes} minutos
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {config.points} pts/acerto
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Results screen
  if (isFinished) {
    const config = difficultyConfig[difficulty || 'all'];
    const percentage = Math.round((score / questions.length) * 100);
    const pointsEarned = score * config.points;
    const correctCount = answers.filter(a => a === 'correct').length;
    const wrongCount = answers.filter(a => a === 'wrong').length;
    const skippedCount = answers.filter(a => a === 'skipped').length;
    const timeUsed = config.timeMinutes * 60 - timeLeft;

    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    else if (percentage >= 50) grade = 'E';

    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-6 py-8">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center ${percentage >= 70 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
            <span className={`text-5xl font-bold ${percentage >= 70 ? 'text-accent' : 'text-destructive'}`}>{grade}</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Prova Finalizada!</h2>
          <p className="text-4xl font-bold font-mono text-primary">{percentage}%</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-card rounded-xl p-4 text-center shadow-card">
            <CheckCircle2 className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{correctCount}</p>
            <p className="text-xs text-muted-foreground">Corretas</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-card">
            <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{wrongCount}</p>
            <p className="text-xs text-muted-foreground">Erradas</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-card">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatTime(timeUsed)}</p>
            <p className="text-xs text-muted-foreground">Tempo</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-card">
            <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">+{pointsEarned}</p>
            <p className="text-xs text-muted-foreground">Pontos</p>
          </div>
        </div>

        {/* Answer overview */}
        <div className="mt-6 bg-card rounded-xl p-4 shadow-card">
          <p className="text-sm font-medium text-foreground mb-3">Resumo das respostas</p>
          <div className="flex flex-wrap gap-1.5">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  a === 'correct' ? 'bg-accent/20 text-accent' : a === 'wrong' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-8 justify-center">
          <button
            onClick={() => { setIsStarted(false); setIsFinished(false); setScore(0); setCurrentIndex(0); setSelectedIndex(null); setFeedback(null); setDifficulty(null); }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-card-hover transition-all"
          >
            Nova Prova
          </button>
        </div>
      </motion.div>
    );
  }

  // Exam question screen
  const question = questions[currentIndex];
  const config = difficultyConfig[difficulty || 'all'];
  const timerPercentage = (timeLeft / (config.timeMinutes * 60)) * 100;
  const isTimeLow = timeLeft < 60;

  // Generate a deterministic illustration description for the question
  const illustrationColors = ['from-primary/20 to-accent/20', 'from-accent/20 to-primary/20', 'from-destructive/10 to-primary/20', 'from-primary/10 to-secondary'];
  const moduleIcons: Record<string, string> = {
    'Introdução à Anatomia': '🦴',
    'Sistema Esquelético': '💀',
    'Sistemas Orgânicos': '🫀',
    'Biomedicina Clínica': '🔬',
    'Biologia Celular': '🧬',
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Timer bar */}
      <div className="bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
              {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
            </span>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isTimeLow ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isTimeLow ? 'bg-destructive' : 'bg-primary'}`}
            animate={{ width: `${timerPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">{currentIndex + 1}/{questions.length}</span>
          <span className="text-xs text-accent font-mono">{score * config.points} pts</span>
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-1 justify-center">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-primary scale-125' :
              answers[i] === 'correct' ? 'bg-accent' :
              answers[i] === 'wrong' ? 'bg-destructive' :
              'bg-muted'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-card rounded-2xl shadow-card overflow-hidden"
        >
          {/* Question illustration */}
          <div className={`h-32 bg-gradient-to-br ${illustrationColors[currentIndex % illustrationColors.length]} flex items-center justify-center relative`}>
            <span className="text-5xl">{moduleIcons[question.module] || '📚'}</span>
            <div className="absolute bottom-2 right-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground">
                {question.module}
              </span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 leading-relaxed">{question.question}</h3>
            <div className="flex flex-col gap-3">
              {question.options.map((option, i) => {
                let optionStyle = 'bg-secondary text-secondary-foreground hover:shadow-card-hover hover:border-primary/30';
                if (selectedIndex !== null) {
                  if (i === question.correctIndex) optionStyle = 'bg-accent/10 text-foreground ring-2 ring-accent';
                  else if (i === selectedIndex) optionStyle = 'bg-destructive/10 text-foreground ring-2 ring-destructive';
                  else optionStyle = 'bg-secondary text-muted-foreground opacity-50';
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selectedIndex !== null}
                    whileTap={selectedIndex === null ? { scale: 0.98 } : {}}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all text-sm leading-relaxed border border-transparent ${optionStyle}`}
                  >
                    <span className="font-mono text-xs text-muted-foreground mr-3 inline-block w-5">{String.fromCharCode(65 + i)}.</span>
                    {option.length > 150 ? option.substring(0, 150) + '...' : option}
                  </motion.button>
                );
              })}
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 flex items-center gap-3 p-4 rounded-xl ${feedback === 'correct' ? 'bg-accent/10' : 'bg-destructive/10'}`}
              >
                {feedback === 'correct'
                  ? <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                }
                <span className="text-sm text-foreground">
                  {feedback === 'correct' ? 'Correto! +' + config.points + ' pts' : 'Incorreto. A resposta correta está destacada.'}
                </span>
                <button
                  onClick={handleNext}
                  className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  {currentIndex < questions.length - 1 ? 'Próxima' : 'Resultado'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Need Brain import for the difficulty selection cards
import { Brain } from 'lucide-react';
