import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Clock, Users, X, Star, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from './UserProfile';

interface FriendsViewProps {
  currentUserId: string;
}

interface FriendRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string;
  total_points: number;
  current_streak: number;
}

export function FriendsView({ currentUserId }: FriendsViewProps) {
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<(ProfileRow & { friendshipId: string })[]>([]);
  const [requests, setRequests] = useState<(ProfileRow & { friendshipId: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [currentUserId]);

  const fetchFriendsAndRequests = async () => {
    setLoading(true);
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

    if (!friendships) { setLoading(false); return; }

    const accepted = friendships.filter(f => f.status === 'accepted');
    const pending = friendships.filter(f => f.status === 'pending' && f.addressee_id === currentUserId);
    const sentPending = friendships.filter(f => f.status === 'pending' && f.requester_id === currentUserId);

    const friendUserIds = accepted.map(f => f.requester_id === currentUserId ? f.addressee_id : f.requester_id);
    const requestUserIds = pending.map(f => f.requester_id);
    const allIds = [...new Set([...friendUserIds, ...requestUserIds])];

    setFriendIds(new Set(friendUserIds));
    setPendingIds(new Set([...requestUserIds, ...sentPending.map(f => f.addressee_id)]));

    let profiles: ProfileRow[] = [];
    if (allIds.length > 0) {
      const { data } = await supabase.from('profiles').select('user_id, display_name, total_points, current_streak').in('user_id', allIds);
      profiles = data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    setFriends(accepted.map(f => {
      const uid = f.requester_id === currentUserId ? f.addressee_id : f.requester_id;
      return { ...(profileMap.get(uid) || { user_id: uid, display_name: 'Usuário', total_points: 0, current_streak: 0 }), friendshipId: f.id };
    }));

    setRequests(pending.map(f => ({
      ...(profileMap.get(f.requester_id) || { user_id: f.requester_id, display_name: 'Usuário', total_points: 0, current_streak: 0 }),
      friendshipId: f.id,
    })));

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, total_points, current_streak')
      .ilike('display_name', `%${searchQuery.trim()}%`)
      .neq('user_id', currentUserId)
      .limit(20);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (targetId: string) => {
    await supabase.from('friendships').insert({ requester_id: currentUserId, addressee_id: targetId });
    setPendingIds(prev => new Set([...prev, targetId]));
  };

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    fetchFriendsAndRequests();
  };

  const rejectRequest = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    fetchFriendsAndRequests();
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const tabs = [
    { id: 'friends' as const, label: 'Amigos', icon: Users, count: friends.length },
    { id: 'requests' as const, label: 'Solicitações', icon: Clock, count: requests.length },
    { id: 'search' as const, label: 'Buscar', icon: Search },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Amigos</h2>
        <p className="text-sm text-muted-foreground mt-1">Conecte-se com outros estudantes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-primary text-primary-foreground shadow-card' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum amigo ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Busque por outros estudantes para adicionar!</p>
            </div>
          ) : friends.map((f, i) => (
            <motion.div
              key={f.friendshipId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setViewProfileId(f.user_id)}
              className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {initials(f.display_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{f.display_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{f.total_points}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{f.current_streak}d</span>
                </div>
              </div>
              <UserCheck className="w-4 h-4 text-accent" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação pendente</div>
          ) : requests.map((r, i) => (
            <motion.div
              key={r.friendshipId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold cursor-pointer"
                onClick={() => setViewProfileId(r.user_id)}>
                {initials(r.display_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate cursor-pointer hover:underline" onClick={() => setViewProfileId(r.user_id)}>
                  {r.display_name}
                </p>
                <p className="text-xs text-muted-foreground">Quer ser seu amigo</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => acceptRequest(r.friendshipId)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  Aceitar
                </button>
                <button onClick={() => rejectRequest(r.friendshipId)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium">
                  Recusar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button onClick={handleSearch} disabled={searching}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              Buscar
            </button>
          </div>

          {searching ? (
            <div className="text-center py-8 text-muted-foreground">Buscando...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((r, i) => {
                const isFriend = friendIds.has(r.user_id);
                const isPending = pendingIds.has(r.user_id);
                return (
                  <motion.div
                    key={r.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold cursor-pointer"
                      onClick={() => setViewProfileId(r.user_id)}>
                      {initials(r.display_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => setViewProfileId(r.user_id)}>
                        {r.display_name}
                      </p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{r.total_points} pts</span>
                    </div>
                    {isFriend ? (
                      <span className="text-xs text-accent flex items-center gap-1"><UserCheck className="w-4 h-4" /> Amigo</span>
                    ) : isPending ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" /> Pendente</span>
                    ) : (
                      <button onClick={() => sendRequest(r.user_id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                        <UserPlus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : searchQuery && !searching ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum resultado encontrado</div>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {viewProfileId && (
          <UserProfile userId={viewProfileId} currentUserId={currentUserId} onClose={() => setViewProfileId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
