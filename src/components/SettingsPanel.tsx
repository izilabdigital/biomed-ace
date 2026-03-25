import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Lock, Save, CheckCircle, Moon, Sun, Users, Search, UserPlus, UserCheck, Clock, Star, Flame, Bell, Copy, Check, Hash, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from './UserProfile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SettingsPanelProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  defaultTab?: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string;
  total_points: number;
  current_streak: number;
  friend_code: string;
}

export function SettingsPanel({ darkMode, onToggleDarkMode, defaultTab = 'profile' }: SettingsPanelProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const currentUserId = user?.id || '';

  // Profile state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Friends state
  const [friends, setFriends] = useState<(ProfileRow & { friendshipId: string })[]>([]);
  const [requests, setRequests] = useState<(ProfileRow & { friendshipId: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [friendsTab, setFriendsTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (currentUserId) fetchFriendsAndRequests();
  }, [currentUserId]);

  // Realtime notifications for friend requests
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${currentUserId}`,
      }, async (payload) => {
        const requesterId = (payload.new as any).requester_id;
        const { data } = await supabase.from('profiles').select('display_name').eq('user_id', requesterId).single();
        const name = data?.display_name || 'Alguém';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('BioCore', { body: `${name} enviou uma solicitação de amizade!` });
        }
        fetchFriendsAndRequests();
      })
      .subscribe();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const fetchFriendsAndRequests = async () => {
    setLoadingFriends(true);
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

    if (!friendships) { setLoadingFriends(false); return; }

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
      const { data } = await supabase.from('profiles').select('user_id, display_name, total_points, current_streak, friend_code').in('user_id', allIds);
      profiles = data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    setFriends(accepted.map(f => {
      const uid = f.requester_id === currentUserId ? f.addressee_id : f.requester_id;
      return { ...(profileMap.get(uid) || { user_id: uid, display_name: 'Usuário', total_points: 0, current_streak: 0, friend_code: '' }), friendshipId: f.id };
    }));

    setRequests(pending.map(f => ({
      ...(profileMap.get(f.requester_id) || { user_id: f.requester_id, display_name: 'Usuário', total_points: 0, current_streak: 0, friend_code: '' }),
      friendshipId: f.id,
    })));

    setLoadingFriends(false);
  };

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return;
    setSaving(true); setError(''); setSuccess('');
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('user_id', user.id);
    if (error) setError(error.message);
    else { setSuccess('Nome atualizado!'); await refreshProfile(); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setError(''); setSuccess('');
    if (newPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setSuccess('Senha alterada!'); setNewPassword(''); setConfirmPassword(''); }
    setSaving(false);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim().replace('#', '');
    if (!q) return;
    setSearching(true);
    const { data } = await supabase.from('profiles').select('user_id, display_name, total_points, current_streak, friend_code').eq('friend_code', q).neq('user_id', currentUserId).limit(1);
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

  return (
    <>
      {/* Profile header card */}
      <div className="bg-card rounded-2xl shadow-card p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
          {initials(profile?.display_name || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">{profile?.display_name || 'Usuário'}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <button
            onClick={async () => {
              if (profile?.friend_code) {
                await navigator.clipboard.writeText(profile.friend_code);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }
            }}
            className="mt-1 flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
          >
            #{profile?.friend_code || '------'}
            {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="profile" className="flex-1 flex items-center gap-1.5 text-xs">
            <User className="w-3.5 h-3.5" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 flex items-center gap-1.5 text-xs relative">
            <Users className="w-3.5 h-3.5" /> Amigos
            {requests.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-0">
          <div className="bg-card rounded-2xl shadow-card p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome de exibição</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={handleSaveName} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:shadow-card-hover transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar nome
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <label className="text-sm font-medium text-foreground">Alterar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={handleChangePassword} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:shadow-card-hover transition-all disabled:opacity-50">
                <Lock className="w-4 h-4" /> Alterar senha
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-accent flex items-center gap-1"><CheckCircle className="w-4 h-4" />{success}</p>}
          </div>

          {/* Appearance */}
          <div className="bg-card rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{darkMode ? 'Modo Escuro' : 'Modo Claro'}</p>
                  <p className="text-xs text-muted-foreground">Alternar aparência do app</p>
                </div>
              </div>
              <button onClick={onToggleDarkMode}
                className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform ${darkMode ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Sign out */}
          <button onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-card shadow-card text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4 mt-0">
          <div className="bg-card rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex gap-2">
              {([
                { id: 'friends' as const, label: 'Amigos', icon: Users, count: friends.length },
                { id: 'requests' as const, label: 'Solicitações', icon: Bell, count: requests.length },
                { id: 'search' as const, label: 'Buscar', icon: Search },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setFriendsTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    friendsTab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}>
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                  {'count' in t && t.count !== undefined && t.count > 0 && (
                    <span className={`text-[10px] px-1 rounded-full ${friendsTab === t.id ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {friendsTab === 'friends' && (
              <div className="space-y-2">
                {loadingFriends ? <p className="text-center py-8 text-muted-foreground text-sm">Carregando...</p>
                  : friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
                    </div>
                  ) : friends.map(f => (
                    <div key={f.friendshipId} onClick={() => setViewProfileId(f.user_id)}
                      className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{initials(f.display_name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{f.display_name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500" />{f.total_points}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" />{f.current_streak}d</span>
                        </div>
                      </div>
                      <UserCheck className="w-4 h-4 text-accent" />
                    </div>
                  ))}
              </div>
            )}

            {friendsTab === 'requests' && (
              <div className="space-y-2">
                {requests.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
                ) : requests.map(r => (
                  <div key={r.friendshipId} className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                      onClick={() => setViewProfileId(r.user_id)}>{initials(r.display_name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{r.display_name}</p>
                      <p className="text-xs text-muted-foreground">Quer ser seu amigo</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => acceptRequest(r.friendshipId)} className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Aceitar</button>
                      <button onClick={() => rejectRequest(r.friendshipId)} className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground text-xs font-medium">Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {friendsTab === 'search' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Digite o código (ex: 123456)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} maxLength={7}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-mono placeholder:text-muted-foreground placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button onClick={handleSearch} disabled={searching} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">Buscar</button>
                </div>
                {searching ? <p className="text-center py-6 text-muted-foreground text-sm">Buscando...</p>
                  : searchResults.length > 0 ? searchResults.map(r => {
                    const isFriend = friendIds.has(r.user_id);
                    const isPending = pendingIds.has(r.user_id);
                    return (
                      <div key={r.user_id} className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                          onClick={() => setViewProfileId(r.user_id)}>{initials(r.display_name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate cursor-pointer hover:underline" onClick={() => setViewProfileId(r.user_id)}>{r.display_name}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500" />{r.total_points} pts</span>
                        </div>
                        {isFriend ? <span className="text-xs text-accent flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Amigo</span>
                          : isPending ? <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pendente</span>
                          : <button onClick={() => sendRequest(r.user_id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium"><UserPlus className="w-3.5 h-3.5" /> Adicionar</button>}
                      </div>
                    );
                  }) : searchQuery && !searching ? <p className="text-center py-6 text-muted-foreground text-sm">Nenhum resultado</p> : null}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {viewProfileId && (
          <UserProfile userId={viewProfileId} currentUserId={currentUserId} onClose={() => setViewProfileId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
