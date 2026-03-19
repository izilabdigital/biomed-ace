import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Save, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileSettingsProps {
  onClose: () => void;
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('user_id', user.id);
    if (error) setError(error.message);
    else { setSuccess('Nome atualizado!'); await refreshProfile(); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    if (newPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setSuccess('Senha alterada com sucesso!'); setNewPassword(''); setConfirmPassword(''); }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-card w-full max-w-md p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Configurações do Perfil</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome de exibição</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={handleSaveName} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:shadow-card-hover transition-all disabled:opacity-50">
            <Save className="w-4 h-4" /> Salvar nome
          </button>
        </div>

        {/* Change password */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-sm font-medium text-foreground">Alterar senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={handleChangePassword} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:shadow-card-hover transition-all disabled:opacity-50">
            <Lock className="w-4 h-4" /> Alterar senha
          </button>
        </div>

        {error && <p className="text-sm text-destructive flex items-center gap-1">{error}</p>}
        {success && <p className="text-sm text-accent flex items-center gap-1"><CheckCircle className="w-4 h-4" />{success}</p>}

        <p className="text-xs text-muted-foreground">Email: {user?.email}</p>
      </motion.div>
    </motion.div>
  );
}
