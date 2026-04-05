import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateOptions {
  contentType: 'flashcards' | 'quiz' | 'exam' | 'wordsearch';
  moduleName: string;
  moduleColor?: string;
  difficulty?: string;
  count?: number;
}

export function useWebhookGenerate() {
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (options: GenerateOptions) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: options,
      });

      if (error) throw error;
      
      if (data?.data) {
        return data.data;
      }
      
      return data;
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error('Erro ao gerar conteúdo via IA. Usando conteúdo existente.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating };
}
