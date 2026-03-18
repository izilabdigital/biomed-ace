import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  rank: number;
  name: string;
  points: number;
  cards: number;
  streak: number;
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  currentUserId: string;
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, total_points, cards_reviewed, current_streak')
        .order('total_points', { ascending: false })
        .limit(20);

      if (data) {
        setPlayers(data.map((p, i) => ({
          rank: i + 1,
          name: p.display_name || 'Anônimo',
          points: p.total_points,
          cards: p.cards_reviewed,
          streak: p.current_streak,
          isCurrentUser: p.user_id === currentUserId,
        })));
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [currentUserId]);

  const rankIcons: Record<number, React.ReactNode> = {
    1: <Trophy className="w-5 h-5 text-warning" />,
    2: <Medal className="w-5 h-5 text-muted-foreground" />,
    3: <Award className="w-5 h-5 text-warning/70" />,
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando ranking...</div>;
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum estudante no ranking ainda. Comece a estudar!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Ranking de Maestria</h2>
          <p className="text-sm text-muted-foreground mt-1">Baseado em pontos acumulados</p>
        </div>

        <div className="divide-y divide-border">
          {players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                player.isCurrentUser ? 'bg-primary/[0.08]' : player.rank <= 3 ? 'bg-primary/[0.03]' : 'hover:bg-secondary/50'
              }`}
            >
              <div className="w-8 flex items-center justify-center">
                {rankIcons[player.rank] || <span className="text-sm font-mono-data text-muted-foreground">{player.rank}</span>}
              </div>

              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {player.name} {player.isCurrentUser && <span className="text-xs text-primary">(você)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{player.streak} dias seguidos · {player.cards} cards</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono-data font-semibold text-foreground">{player.points.toLocaleString()}</p>
                <p className="text-xs font-mono-data text-accent">pts</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
