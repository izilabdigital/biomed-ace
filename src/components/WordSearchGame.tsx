import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Sparkles, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WordSearchWord {
  id: string;
  word: string;
  explanation: string;
  module: string;
}

const GRID_SIZE = 14;
const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [-1, 1],  // diagonal up-right
  [0, -1],  // left
  [1, -1],  // diagonal down-left
  [-1, 0],  // up
  [-1, -1], // diagonal up-left
];

function generateGrid(words: string[]): { grid: string[][]; placements: Map<string, number[][]> } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => '')
  );
  const placements = new Map<string, number[][]>();

  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    let placed = false;
    const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const dir = shuffledDirs[attempt % shuffledDirs.length];
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);

      const endRow = startRow + dir[0] * (word.length - 1);
      const endCol = startCol + dir[1] * (word.length - 1);

      if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) continue;

      let canPlace = true;
      const cells: number[][] = [];

      for (let i = 0; i < word.length; i++) {
        const r = startRow + dir[0] * i;
        const c = startCol + dir[1] * i;
        cells.push([r, c]);
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          grid[cells[i][0]][cells[i][1]] = word[i];
        }
        placements.set(word, cells);
        placed = true;
      }
    }
  }

  // Fill empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, placements };
}

import { useWebhookGenerate } from '@/hooks/useWebhookGenerate';
import { Loader2 } from 'lucide-react';

interface WordSearchGameProps {
  moduleFilter?: string;
}

export function WordSearchGame({ moduleFilter }: WordSearchGameProps) {
  const { generate, generating } = useWebhookGenerate();
  const [allWords, setAllWords] = useState<WordSearchWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<number[][]>([]);
  const [highlightedCells, setHighlightedCells] = useState<Map<string, number[][]>>(new Map());
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [startCell, setStartCell] = useState<number[] | null>(null);

  useEffect(() => {
    const fetchWords = async () => {
      if (!moduleFilter) {
        setLoading(false);
        return;
      }
      
      const result = await generate({
        contentType: 'wordsearch',
        moduleName: moduleFilter,
        count: 12,
      });

      if (result?.words && Array.isArray(result.words)) {
        const webhookWords: WordSearchWord[] = result.words.map((w: any, i: number) => ({
          id: `webhook-word-${i}`,
          word: w.word?.toUpperCase() || w.toUpperCase(),
          explanation: w.explanation || w.word,
          module: moduleFilter,
        }));
        setAllWords(webhookWords);
      }
      setLoading(false);
    };
    fetchWords();
  }, [moduleFilter]);

  const gameWords = useMemo(() => {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(12, shuffled.length));
  }, [allWords]);

  const { grid, placements } = useMemo(() => {
    if (gameWords.length === 0) return { grid: [], placements: new Map() };
    return generateGrid(gameWords.map(w => w.word));
  }, [gameWords]);

  const handleCellMouseDown = useCallback((r: number, c: number) => {
    setSelecting(true);
    setStartCell([r, c]);
    setSelectedCells([[r, c]]);
  }, []);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (!selecting || !startCell) return;

    const dr = Math.sign(r - startCell[0]);
    const dc = Math.sign(c - startCell[1]);

    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dr === 0 && dc === 0) return;
    const absDr = Math.abs(r - startCell[0]);
    const absDc = Math.abs(c - startCell[1]);
    if (absDr !== 0 && absDc !== 0 && absDr !== absDc) return;

    const cells: number[][] = [];
    const steps = Math.max(absDr, absDc);
    for (let i = 0; i <= steps; i++) {
      cells.push([startCell[0] + dr * i, startCell[1] + dc * i]);
    }
    setSelectedCells(cells);
  }, [selecting, startCell]);

  const handleMouseUp = useCallback(() => {
    if (!selecting) return;
    setSelecting(false);

    // Check if selected cells match any word
    const selectedWord = selectedCells.map(([r, c]) => grid[r][c]).join('');
    const reversedWord = [...selectedWord].reverse().join('');

    for (const gw of gameWords) {
      if (foundWords.has(gw.word)) continue;
      if (selectedWord === gw.word || reversedWord === gw.word) {
        setFoundWords(prev => new Set([...prev, gw.word]));
        setHighlightedCells(prev => new Map([...prev, [gw.word, selectedCells]]));
        setShowExplanation(gw.word);
        setTimeout(() => setShowExplanation(null), 5000);
        break;
      }
    }
    setSelectedCells([]);
    setStartCell(null);
  }, [selecting, selectedCells, grid, gameWords, foundWords]);

  const isCellSelected = useCallback((r: number, c: number) => {
    return selectedCells.some(([sr, sc]) => sr === r && sc === c);
  }, [selectedCells]);

  const getCellHighlightColor = useCallback((r: number, c: number): string | null => {
    const colors = [
      'bg-primary/30', 'bg-accent/30', 'bg-destructive/20',
      'bg-blue-500/20', 'bg-purple-500/20', 'bg-orange-500/20',
      'bg-teal-500/20', 'bg-pink-500/20', 'bg-yellow-500/20',
    ];
    let idx = 0;
    for (const [word, cells] of highlightedCells) {
      if (cells.some(([cr, cc]) => cr === r && cc === c)) {
        return colors[idx % colors.length];
      }
      idx++;
    }
    return null;
  }, [highlightedCells]);

  if (generating || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-muted-foreground">Gerando caça-palavras com IA...</div>
      </div>
    );
  }

  if (gameWords.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma palavra disponível</h3>
        <p className="text-muted-foreground text-sm">O administrador precisa fazer upload de um PDF para gerar palavras para o caça-palavras.</p>
      </div>
    );
  }

  const isComplete = foundWords.size === gameWords.length;
  const currentExplanation = showExplanation ? gameWords.find(w => w.word === showExplanation) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Search className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Caça-Palavras</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Encontre {gameWords.length} termos científicos! Clique e arraste para selecionar.
        </p>
      </div>

      {/* Explanation popup */}
      <AnimatePresence>
        {currentExplanation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 rounded-xl bg-accent/10 border border-accent/30"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{currentExplanation.word}</p>
                <p className="text-sm text-muted-foreground mt-1">{currentExplanation.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 rounded-2xl bg-accent/10 border border-accent/30 text-center"
        >
          <Trophy className="w-10 h-10 text-accent mx-auto mb-2" />
          <h3 className="text-xl font-bold text-foreground">Parabéns!</h3>
          <p className="text-muted-foreground">Você encontrou todas as palavras!</p>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid */}
        <div
          className="bg-card rounded-2xl shadow-card p-3 sm:p-4 select-none overflow-x-auto"
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { if (selecting) handleMouseUp(); }}
          onTouchEnd={handleMouseUp}
        >
          <div className="grid gap-0.5 sm:gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelected = isCellSelected(r, c);
                const highlightColor = getCellHighlightColor(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleCellMouseDown(r, c)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onTouchStart={() => handleCellMouseDown(r, c)}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      const cellData = el?.getAttribute('data-cell');
                      if (cellData) {
                        const [tr, tc] = cellData.split(',').map(Number);
                        handleCellMouseEnter(tr, tc);
                      }
                    }}
                    data-cell={`${r},${c}`}
                    className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs sm:text-sm font-bold cursor-pointer transition-all
                      ${isSelected ? 'bg-primary/40 text-primary scale-110' : ''}
                      ${highlightColor ? `${highlightColor} text-foreground` : ''}
                      ${!isSelected && !highlightColor ? 'text-foreground hover:bg-secondary' : ''}
                    `}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Word list */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Palavras ({foundWords.size}/{gameWords.length})
          </h3>
          <div className="space-y-2">
            {gameWords.map((w) => {
              const isFound = foundWords.has(w.word);
              return (
                <motion.div
                  key={w.id}
                  layout
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isFound
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-secondary/50'
                  }`}
                >
                  <span className={`text-sm font-mono font-bold ${isFound ? 'line-through text-accent' : 'text-foreground'}`}>
                    {w.word}
                  </span>
                  {isFound && (
                    <button
                      onClick={() => setShowExplanation(showExplanation === w.word ? null : w.word)}
                      className="ml-auto p-1 rounded hover:bg-accent/20"
                    >
                      <Info className="w-3.5 h-3.5 text-accent" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
