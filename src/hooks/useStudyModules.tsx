import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StudyModule {
  id: string;
  name: string;
  color: string;
}

export function useStudyModules() {
  const [modules, setModules] = useState<StudyModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    const { data } = await supabase
      .from('study_modules')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setModules(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  return { modules, loading, refetch: fetchModules };
}
