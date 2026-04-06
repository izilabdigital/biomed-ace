import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Plus, CheckCircle, Loader2, BookOpen, BarChart3, Users, Settings, Layers, Link, Sparkles, Brain, HelpCircle, GraduationCap, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DynamicFlashcard {
  id: string;
  module: string;
  module_color: string;
  front: string;
  back: string;
  difficulty: string;
  created_at: string;
}

interface ContentUpload {
  id: string;
  file_name: string;
  module_name: string;
  module_color: string;
  status: string;
  cards_generated: number;
  created_at: string;
}

interface StudyModule {
  id: string;
  name: string;
  color: string;
}

const MODULE_COLORS = [
  { value: 'primary', label: 'Azul', class: 'bg-primary' },
  { value: 'accent', label: 'Verde', class: 'bg-accent' },
  { value: 'warning', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'destructive', label: 'Vermelho', class: 'bg-destructive' },
];

const ACCEPTED_FILE_TYPES = '.txt,.doc,.docx,.rtf,.odt,.md,.csv,.text';
const DEFAULT_WEBHOOK_URL = 'https://n8n-n8n.xwskpb.easypanel.host/webhook/biocore-appz';

function getWebhookUrl(): string {
  return localStorage.getItem('admin_webhook_url') || DEFAULT_WEBHOOK_URL;
}

function setWebhookUrlStorage(url: string) {
  localStorage.setItem('admin_webhook_url', url);
}

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'modules' | 'upload' | 'content' | 'stats' | 'webhook'>('modules');
  const [flashcards, setFlashcards] = useState<DynamicFlashcard[]>([]);
  const [uploads, setUploads] = useState<ContentUpload[]>([]);
  const [studyModules, setStudyModules] = useState<StudyModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ totalCards: 0, totalModules: 0, totalUsers: 0 });

  // New module form
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleColor, setNewModuleColor] = useState('primary');
  // Upload module selection
  const [selectedModuleId, setSelectedModuleId] = useState('');
  // Webhook config
  const [webhookUrl, setWebhookUrl] = useState(getWebhookUrl());
  const [testingWebhook, setTestingWebhook] = useState(false);
  // Manual generation
  const [genModuleId, setGenModuleId] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cardsRes, uploadsRes, profilesRes, modulesRes] = await Promise.all([
      supabase.from('dynamic_flashcards').select('*').order('created_at', { ascending: false }),
      supabase.from('content_uploads').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id', { count: 'exact' }),
      supabase.from('study_modules').select('*').order('created_at', { ascending: true }),
    ]);

    if (cardsRes.data) setFlashcards(cardsRes.data);
    if (uploadsRes.data) setUploads(uploadsRes.data);
    if (modulesRes.data) setStudyModules(modulesRes.data);

    const modules = new Set(cardsRes.data?.map(c => c.module) || []);
    setStats({
      totalCards: cardsRes.data?.length || 0,
      totalModules: modulesRes.data?.length || 0,
      totalUsers: profilesRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddModule = async () => {
    if (!newModuleName.trim()) {
      toast.error('Informe o nome do módulo');
      return;
    }
    const { error } = await supabase.from('study_modules').insert({
      name: newModuleName.trim(),
      color: newModuleColor,
      created_by: user?.id || '',
    });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Módulo já existe' : 'Erro ao criar módulo');
    } else {
      toast.success(`Módulo "${newModuleName}" criado!`);
      setNewModuleName('');
      fetchData();
    }
  };

  const handleDeleteStudyModule = async (mod: StudyModule) => {
    // Delete the module and all associated content
    await Promise.all([
      supabase.from('dynamic_flashcards').delete().eq('module', mod.name),
      supabase.from('dynamic_questions').delete().eq('module', mod.name),
      supabase.from('word_search_words').delete().eq('module', mod.name),
      supabase.from('study_modules').delete().eq('id', mod.id),
    ]);
    toast.success(`Módulo "${mod.name}" e todo conteúdo excluídos`);
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileText(reader.result as string);
      toast.success(`Arquivo "${file.name}" carregado`);
    };
    reader.onerror = () => toast.error('Erro ao ler arquivo');
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    const selectedModule = studyModules.find(m => m.id === selectedModuleId);
    if (!selectedModule) {
      toast.error('Selecione um módulo');
      return;
    }
    if (!fileText.trim()) {
      toast.error('Carregue um arquivo primeiro');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fileText,
          moduleName: selectedModule.name,
          moduleColor: selectedModule.color,
          fileName,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Erro ${response.status}: ${text || 'webhook falhou'}`);
      }

      toast.success(`Arquivo enviado para processamento no módulo "${selectedModule.name}"!`);
      setFileText('');
      setFileName('');
      setSelectedModuleId('');
      fetchData();
    } catch (err: any) {
      console.error('Webhook error:', err);
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualGenerate = async (contentType: 'flashcards' | 'quiz' | 'exam' | 'wordsearch') => {
    const selectedModule = studyModules.find(m => m.id === genModuleId);
    if (!selectedModule) {
      toast.error('Selecione um módulo');
      return;
    }
    setGeneratingType(contentType);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType,
          moduleName: selectedModule.name,
          moduleColor: selectedModule.color,
          count: genCount,
          webhookUrl: getWebhookUrl(),
        },
      });
      if (error) throw error;

      const result = data?.data || data;
      let savedCount = 0;

      if (contentType === 'flashcards' && result?.flashcards) {
        for (const fc of result.flashcards) {
          await supabase.from('dynamic_flashcards').insert({
            module: selectedModule.name,
            module_color: selectedModule.color,
            front: fc.front,
            back: fc.back,
            difficulty: fc.difficulty || 'medium',
            created_by: user?.id || '',
          });
          savedCount++;
        }
      } else if ((contentType === 'quiz' || contentType === 'exam') && result?.questions) {
        for (const q of result.questions) {
          await supabase.from('dynamic_questions').insert({
            module: selectedModule.name,
            module_color: selectedModule.color,
            question_text: q.question,
            options: q.options,
            correct_index: q.correctIndex,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            question_type: contentType,
            created_by: user?.id || '',
          });
          savedCount++;
        }
      } else if (contentType === 'wordsearch' && result?.words) {
        for (const w of result.words) {
          await supabase.from('word_search_words').insert({
            module: selectedModule.name,
            module_color: selectedModule.color,
            word: w.word.toUpperCase(),
            explanation: w.explanation,
            created_by: user?.id || '',
          });
          savedCount++;
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} itens de "${contentType}" gerados e salvos para "${selectedModule.name}"!`);
        fetchData();
      } else {
        toast.warning('Webhook respondeu mas nenhum item foi salvo. Verifique o formato JSON.');
        console.log('Webhook response:', result);
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error('Erro ao gerar: ' + (err.message || 'Falha na requisição'));
    } finally {
      setGeneratingType(null);
    }
  };

  const groupedByModule = flashcards.reduce((acc, fc) => {
    if (!acc[fc.module]) acc[fc.module] = [];
    acc[fc.module].push(fc);
    return acc;
  }, {} as Record<string, DynamicFlashcard[]>);

  const tabs = [
    { id: 'modules' as const, label: 'Módulos', icon: Layers },
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'content' as const, label: 'Conteúdos', icon: BookOpen },
    { id: 'stats' as const, label: 'Estatísticas', icon: BarChart3 },
    { id: 'webhook' as const, label: 'Webhook', icon: Link },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-destructive/10">
            <Settings className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerencie módulos, conteúdos e monitore a plataforma</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-secondary/50 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-destructive text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MODULES TAB */}
        {activeTab === 'modules' && (
          <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-destructive" />
                Adicionar Módulo de Estudo
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome do Módulo</label>
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={e => setNewModuleName(e.target.value)}
                    placeholder="Ex: Sistema Nervoso"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
                  <div className="flex gap-3 flex-wrap">
                    {MODULE_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewModuleColor(color.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          newModuleColor === color.value ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/30'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.class}`} />
                        <span className="text-sm">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddModule} className="px-6 py-2.5 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Módulo
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Módulos Cadastrados</h2>
              {studyModules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum módulo cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {studyModules.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${MODULE_COLORS.find(c => c.value === mod.color)?.class || 'bg-primary'}`} />
                        <span className="font-medium text-foreground">{mod.name}</span>
                      </div>
                      <button onClick={() => handleDeleteStudyModule(mod)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-destructive" />
                Enviar Arquivo de Texto
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Arquivo (TXT, DOC, DOCX, RTF, MD, CSV...)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
                    <div className="flex flex-col items-center">
                      {fileName ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                          <span className="text-sm text-foreground font-medium">{fileName}</span>
                          <span className="text-xs text-muted-foreground">{fileText.length.toLocaleString()} caracteres</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Clique para selecionar um arquivo de texto</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Módulo</label>
                  <select
                    value={selectedModuleId}
                    onChange={e => setSelectedModuleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  >
                    <option value="">Selecione um módulo</option>
                    {studyModules.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                    ))}
                  </select>
                  {studyModules.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Crie módulos na aba "Módulos" primeiro</p>
                  )}
                </div>

                {fileText && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prévia do conteúdo</label>
                    <div className="p-3 rounded-xl bg-secondary/50 max-h-40 overflow-y-auto">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{fileText.substring(0, 2000)}{fileText.length > 2000 ? '...' : ''}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConvert}
                  disabled={processing || !fileText || !selectedModuleId}
                  className="w-full py-3 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando para processamento...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Enviar para Processar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Uploads Recentes</h2>
              {uploads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum upload ainda</p>
              ) : (
                <div className="space-y-3">
                  {uploads.map(upload => (
                    <div key={upload.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${upload.status === 'completed' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                          {upload.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{upload.module_name}</p>
                          <p className="text-xs text-muted-foreground">{upload.file_name}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{upload.cards_generated} cards</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {Object.keys(groupedByModule).length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum conteúdo dinâmico criado</p>
              </div>
            ) : (
              Object.entries(groupedByModule).map(([module, cards]) => (
                <div key={module} className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${cards[0]?.module_color || 'primary'}`} />
                      <h3 className="font-semibold">{module}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{cards.length} cards</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cards.slice(0, 5).map(card => (
                      <div key={card.id} className="p-3 rounded-xl bg-secondary/50 text-sm">
                        <p className="font-medium text-foreground">{card.front}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{card.back.substring(0, 100)}...</p>
                      </div>
                    ))}
                    {cards.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">+ {cards.length - 5} cards ocultos</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <BookOpen className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-3xl font-bold text-foreground">{stats.totalCards}</p>
              <p className="text-sm text-muted-foreground">Flashcards Dinâmicos</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <Layers className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-3xl font-bold text-foreground">{stats.totalModules}</p>
              <p className="text-sm text-muted-foreground">Módulos Criados</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Registrados</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'webhook' && (
          <motion.div key="webhook" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card max-w-xl">
              <h2 className="text-lg font-bold text-foreground mb-1">Configuração do Webhook</h2>
              <p className="text-sm text-muted-foreground mb-4">URL do webhook do n8n para processamento de conteúdo com IA.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">URL do Webhook</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWebhookUrlStorage(webhookUrl);
                      toast.success('Webhook salvo com sucesso!');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setWebhookUrl(DEFAULT_WEBHOOK_URL);
                      setWebhookUrlStorage(DEFAULT_WEBHOOK_URL);
                      toast.success('Webhook restaurado ao padrão.');
                    }}
                    className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    disabled={testingWebhook}
                    onClick={async () => {
                      setTestingWebhook(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-content', {
                          body: {
                            contentType: 'flashcards',
                            moduleName: 'teste',
                            moduleColor: 'primary',
                            count: 1,
                            webhookUrl,
                          },
                        });
                        if (error) throw error;
                        toast.success('Webhook respondeu com sucesso!');
                        console.log('Webhook test response:', data);
                      } catch (err: any) {
                        console.error('Webhook test error:', err);
                        toast.error('Erro ao conectar ao webhook: ' + (err.message || 'Sem resposta'));
                      } finally {
                        setTestingWebhook(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {testingWebhook ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Testando...</span>
                    ) : 'Testar Conexão'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Padrão: {DEFAULT_WEBHOOK_URL}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card max-w-xl mt-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Formatos JSON Esperados do n8n</h2>
              <p className="text-sm text-muted-foreground mb-4">Configure seu workflow do n8n para retornar os seguintes formatos de acordo com o campo <code className="bg-muted px-1 rounded text-xs">contentType</code> recebido.</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">📇 Flashcards <code className="bg-muted px-1 rounded text-xs">contentType: "flashcards"</code></h3>
                  <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{`{
  "flashcards": [
    {
      "front": "Pergunta do flashcard",
      "back": "Resposta do flashcard",
      "difficulty": "easy | medium | hard",
      "moduleColor": "primary"
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">❓ Quiz <code className="bg-muted px-1 rounded text-xs">contentType: "quiz"</code></h3>
                  <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{`{
  "questions": [
    {
      "question": "Texto da pergunta",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 0,
      "difficulty": "easy | medium | hard",
      "explanation": "Explicação opcional"
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">📝 Prova <code className="bg-muted px-1 rounded text-xs">contentType: "exam"</code></h3>
                  <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{`{
  "questions": [
    {
      "question": "Texto da pergunta da prova",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 2,
      "difficulty": "easy | medium | hard",
      "explanation": "Explicação da resposta"
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">🔤 Caça-Palavras <code className="bg-muted px-1 rounded text-xs">contentType: "wordsearch"</code></h3>
                  <pre className="bg-muted rounded-lg p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{`{
  "words": [
    {
      "word": "MITOSE",
      "explanation": "Divisão celular que gera duas células idênticas"
    }
  ]
}`}
                  </pre>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">📨 Payload Enviado ao Webhook</h3>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`{
  "action": "generate",
  "contentType": "flashcards | quiz | exam | wordsearch",
  "moduleName": "Nome do Módulo",
  "moduleColor": "primary",
  "difficulty": "easy | medium | hard | all",
  "count": 10
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card max-w-xl mt-6">
              <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-destructive" />
                Gerar Conteúdo sob Demanda
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Gere flashcards, questões de quiz/prova ou palavras para caça-palavras via IA para o módulo selecionado.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Módulo</label>
                  <select
                    value={genModuleId}
                    onChange={e => setGenModuleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  >
                    <option value="">Selecione um módulo</option>
                    {studyModules.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={genCount}
                    onChange={e => setGenCount(Number(e.target.value))}
                    className="w-32 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {([
                    { type: 'flashcards' as const, label: 'Flashcards', icon: Brain },
                    { type: 'quiz' as const, label: 'Quiz', icon: HelpCircle },
                    { type: 'exam' as const, label: 'Prova', icon: GraduationCap },
                    { type: 'wordsearch' as const, label: 'Caça-Palavras', icon: Search },
                  ]).map(item => (
                    <button
                      key={item.type}
                      disabled={generatingType !== null || !genModuleId}
                      onClick={() => handleManualGenerate(item.type)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground font-medium text-sm hover:bg-destructive hover:text-white hover:border-destructive transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingType === item.type ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <item.icon className="w-4 h-4" />
                      )}
                      {generatingType === item.type ? 'Gerando...' : `Gerar ${item.label}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
