import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface Player {
  rank: number;
  name: string;
  points: number;
  accuracy: number;
  streak: number;
}

const mockLeaderboard: Player[] = [
  { rank: 1, name: 'Ana Silva', points: 2840, accuracy: 96, streak: 14 },
  { rank: 2, name: 'Carlos Mendes', points: 2650, accuracy: 93, streak: 11 },
  { rank: 3, name: 'Beatriz Souza', points: 2480, accuracy: 91, streak: 9 },
  { rank: 4, name: 'Diego Lima', points: 2310, accuracy: 89, streak: 7 },
  { rank: 5, name: 'Fernanda Costa', points: 2150, accuracy: 87, streak: 6 },
  { rank: 6, name: 'Gabriel Rocha', points: 1980, accuracy: 85, streak: 5 },
  { rank: 7, name: 'Helena Ferreira', points: 1820, accuracy: 83, streak: 4 },
  { rank: 8, name: 'Igor Santos', points: 1690, accuracy: 81, streak: 3 },
  { rank: 9, name: 'Julia Almeida', points: 1540, accuracy: 79, streak: 2 },
  { rank: 10, name: 'Lucas Pereira', points: 1400, accuracy: 77, streak: 1 },
];

const rankIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="w-5 h-5 text-warning" />,
  2: <Medal className="w-5 h-5 text-muted-foreground" />,
  3: <Award className="w-5 h-5 text-warning/70" />,
};

export function Leaderboard() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Ranking de Maestria</h2>
          <p className="text-sm text-muted-foreground mt-1">Baseado em precisão + consistência</p>
        </div>

        <div className="divide-y divide-border">
          {mockLeaderboard.map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors ${
                player.rank <= 3 ? 'bg-primary/[0.03]' : ''
              }`}
            >
              <div className="w-8 flex items-center justify-center">
                {rankIcons[player.rank] || (
                  <span className="text-sm font-mono-data text-muted-foreground">{player.rank}</span>
                )}
              </div>

              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {player.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground">{player.streak} dias seguidos</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono-data font-semibold text-foreground">{player.points.toLocaleString()}</p>
                <p className="text-xs font-mono-data text-accent">{player.accuracy}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
