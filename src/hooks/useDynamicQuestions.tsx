import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DynamicQuestion {
  id: string;
  module: string;
  module_color: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  question_type: string;
  difficulty: string;
}

export function useDynamicQuestions(type?: 'quiz' | 'exam', moduleFilter?: string) {
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from('dynamic_questions').select('*');
      if (type) query = query.eq('question_type', type);
      if (moduleFilter) query = query.eq('module', moduleFilter);
      const { data } = await query;
      if (data) {
        setQuestions(data.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [type, moduleFilter]);

  return { questions, loading };
}
