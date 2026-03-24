import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Brain, Trophy, Flame, Star, UserPlus, UserCheck, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileProps {
  userId: string;
  currentUserId: string;
  onClose: () => void;
}

interface ProfileData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  cards_reviewed: number;
  quizzes_completed: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  friend_code: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export function UserProfile({ userId, currentUserId, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const isSelf = userId === currentUserId;

  useEffect(() => {
    fetchProfile();
    if (!isSelf) fetchFriendship();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, total_points, cards_reviewed, quizzes_completed, current_streak, best_streak, created_at, friend_code')
      .eq('user_id', userId)
      .single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchFriendship = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
      .limit(1);

    if (data && data.length > 0) {
      const f = data[0];
      setFriendshipId(f.id);
      if (f.status === 'accepted') setFriendStatus('accepted');
      else if (f.status === 'pending' && f.requester_id === currentUserId) setFriendStatus('pending_sent');
      else if (f.status === 'pending' && f.addressee_id === currentUserId) setFriendStatus('pending_received');
    } else {
      setFriendStatus('none');
      setFriendshipId(null);
    }
  };

  const sendFriendRequest = async () => {
    setActionLoading(true);
    await supabase.from('friendships').insert({ requester_id: currentUserId, addressee_id: userId });
    await fetchFriendship();
    setActionLoading(false);
  };

  const acceptRequest = async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    await fetchFriendship();
    setActionLoading(false);
  };

  const removeFriend = async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    await supabase.from('friendships').delete().eq('id', friendshipId);
    setFriendStatus('none');
    setFriendshipId(null);
    setActionLoading(false);
  };

  const stats = profile ? [
    { label: 'Pontos', value: profile.total_points, icon: Star, color: 'text-yellow-500' },
    { label: 'Cards revisados', value: profile.cards_reviewed, icon: BookOpen, color: 'text-blue-500' },
    { label: 'Quizzes feitos', value: profile.quizzes_completed, icon: Brain, color: 'text-purple-500' },
    { label: 'Sequência atual', value: profile.current_streak, icon: Flame, color: 'text-orange-500' },
    { label: 'Melhor sequência', value: profile.best_streak, icon: Trophy, color: 'text-emerald-500' },
  ] : [];

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-card w-full max-w-md overflow-hidden"
      >
        {/* Header with gradient */}
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-10">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold border-4 border-card shadow-lg">
            {loading ? '...' : initials}
          </div>

          {loading ? (
            <div className="mt-4 animate-pulse space-y-3">
              <div className="h-5 bg-secondary rounded w-32" />
              <div className="h-4 bg-secondary rounded w-48" />
            </div>
          ) : profile ? (
            <>
              <div className="mt-3">
                <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Friend actions */}
              {!isSelf && (
                <div className="mt-4">
                  {friendStatus === 'none' && (
                    <button onClick={sendFriendRequest} disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:shadow-card-hover transition-all disabled:opacity-50">
                      <UserPlus className="w-4 h-4" /> Adicionar amigo
                    </button>
                  )}
                  {friendStatus === 'pending_sent' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Solicitação enviada</span>
                      <button onClick={removeFriend} disabled={actionLoading}
                        className="text-xs text-destructive hover:underline">Cancelar</button>
                    </div>
                  )}
                  {friendStatus === 'pending_received' && (
                    <div className="flex items-center gap-2">
                      <button onClick={acceptRequest} disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                        <UserCheck className="w-4 h-4" /> Aceitar
                      </button>
                      <button onClick={removeFriend} disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium">
                        Recusar
                      </button>
                    </div>
                  )}
                  {friendStatus === 'accepted' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-accent flex items-center gap-1 font-medium"><UserCheck className="w-4 h-4" /> Amigos</span>
                      <button onClick={removeFriend} disabled={actionLoading}
                        className="text-xs text-destructive hover:underline">Remover</button>
                    </div>
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-secondary rounded-xl p-3 flex items-center gap-3"
                  >
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div>
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Perfil não encontrado.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
