import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Plus, CheckCircle, AlertCircle, Loader2, BookOpen, BarChart3, Users, Settings } from 'lucide-react';
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

const MODULE_COLORS = [
  { value: 'primary', label: 'Azul', class: 'bg-primary' },
  { value: 'accent', label: 'Verde', class: 'bg-accent' },
  { value: 'warning', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'destructive', label: 'Vermelho', class: 'bg-destructive' },
];

export function AdminPanel() {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'content' | 'stats'>('upload');
  const [flashcards, setFlashcards] = useState<DynamicFlashcard[]>([]);
  const [uploads, setUploads] = useState<ContentUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleColor, setModuleColor] = useState('primary');
  const [pdfText, setPdfText] = useState('');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ totalCards: 0, totalModules: 0, totalUsers: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cardsRes, uploadsRes, profilesRes] = await Promise.all([
      supabase.from('dynamic_flashcards').select('*').order('created_at', { ascending: false }),
      supabase.from('content_uploads').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id', { count: 'exact' }),
    ]);

    if (cardsRes.data) setFlashcards(cardsRes.data);
    if (uploadsRes.data) setUploads(uploadsRes.data);

    const modules = new Set(cardsRes.data?.map(c => c.module) || []);
    setStats({
      totalCards: cardsRes.data?.length || 0,
      totalModules: modules.size,
      totalUsers: profilesRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Extract text from PDF using FileReader
    const reader = new FileReader();
    reader.onload = async () => {
      const text = await extractTextFromPdf(reader.result as ArrayBuffer);
      setPdfText(text);
      toast.success(`PDF "${file.name}" carregado com sucesso`);
    };
    reader.readAsArrayBuffer(file);
  };

  const extractTextFromPdf = async (buffer: ArrayBuffer): Promise<string> => {
    // Simple PDF text extraction - handles basic text content
    const uint8Array = new Uint8Array(buffer);
    const text = new TextDecoder('latin1').decode(uint8Array);
    
    // Extract text between stream markers (simplified)
    const textParts: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(text)) !== null) {
      const content = match[1];
      // Extract text operators (Tj, TJ, ')
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(content)) !== null) {
        textParts.push(tjMatch[1]);
      }
    }
    
    // If simple extraction fails, just get readable ASCII
    if (textParts.length === 0) {
      const readableText = text.replace(/[^\x20-\x7E\xC0-\xFF\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return readableText.substring(0, 50000);
    }
    
    return textParts.join(' ');
  };

  const handleConvert = async () => {
    if (!moduleName.trim()) {
      toast.error('Informe o nome do módulo');
      return;
    }
    if (!pdfText.trim()) {
      toast.error('Carregue um PDF primeiro');
      return;
    }

    setProcessing(true);
    try {
      const response = await supabase.functions.invoke('convert-pdf', {
        body: { pdfText, moduleName, moduleColor },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao converter');
      }

      const data = response.data;
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`${data.cardsGenerated} flashcards gerados para "${moduleName}"!`);
      setPdfText('');
      setFileName('');
      setModuleName('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteModule = async (module: string) => {
    const { error } = await supabase
      .from('dynamic_flashcards')
      .delete()
      .eq('module', module);

    if (error) {
      toast.error('Erro ao excluir módulo');
    } else {
      toast.success(`Módulo "${module}" excluído`);
      fetchData();
    }
  };

  const groupedByModule = flashcards.reduce((acc, fc) => {
    if (!acc[fc.module]) acc[fc.module] = [];
    acc[fc.module].push(fc);
    return acc;
  }, {} as Record<string, DynamicFlashcard[]>);

  const tabs = [
    { id: 'upload' as const, label: 'Upload PDF', icon: Upload },
    { id: 'content' as const, label: 'Conteúdos', icon: BookOpen },
    { id: 'stats' as const, label: 'Estatísticas', icon: BarChart3 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Admin Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-destructive/10">
            <Settings className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerencie conteúdos e monitore a plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-secondary/50 rounded-xl w-fit">
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
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Upload Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-destructive" />
                Converter PDF em Flashcards
              </h2>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Arquivo PDF</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
                    <div className="flex flex-col items-center">
                      {fileName ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                          <span className="text-sm text-foreground font-medium">{fileName}</span>
                          <span className="text-xs text-muted-foreground">{pdfText.length.toLocaleString()} caracteres extraídos</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Clique para selecionar um PDF</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {/* Module Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome do Módulo</label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={e => setModuleName(e.target.value)}
                    placeholder="Ex: Sistema Nervoso"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  />
                </div>

                {/* Module Color */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cor do Módulo</label>
                  <div className="flex gap-3">
                    {MODULE_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setModuleColor(color.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          moduleColor === color.value
                            ? 'border-destructive bg-destructive/10'
                            : 'border-border hover:border-destructive/30'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.class}`} />
                        <span className="text-sm">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={processing || !pdfText || !moduleName}
                  className="w-full py-3 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Gerar Flashcards
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Uploads */}
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
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {Object.keys(groupedByModule).length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum conteúdo dinâmico criado</p>
                <p className="text-sm text-muted-foreground mt-1">Use a aba Upload para adicionar conteúdos via PDF</p>
              </div>
            ) : (
              Object.entries(groupedByModule).map(([module, cards]) => (
                <div key={module} className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${cards[0]?.module_color || 'primary'}`} />
                      <h3 className="font-semibold">{module}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {cards.length} cards
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteModule(module)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cards.slice(0, 5).map(card => (
                      <div key={card.id} className="p-3 rounded-xl bg-secondary/50 text-sm">
                        <p className="font-medium text-foreground">{card.front}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{card.back.substring(0, 100)}...</p>
                      </div>
                    ))}
                    {cards.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        + {cards.length - 5} cards ocultos
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <BookOpen className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-3xl font-bold text-foreground">{stats.totalCards}</p>
              <p className="text-sm text-muted-foreground">Flashcards Dinâmicos</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
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
      </AnimatePresence>
    </div>
  );
}
