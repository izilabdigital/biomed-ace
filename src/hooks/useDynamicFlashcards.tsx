import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { flashcards as staticFlashcards, Flashcard, modules as staticModules } from '@/data/flashcards';

export function useDynamicFlashcards() {
  const [allCards, setAllCards] = useState<Flashcard[]>(staticFlashcards);
  const [allModules, setAllModules] = useState(staticModules);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamic = async () => {
      const { data } = await supabase
        .from('dynamic_flashcards')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const maxStaticId = Math.max(...staticFlashcards.map(c => c.id));
        const dynamicCards: Flashcard[] = data.map((d, i) => ({
          id: maxStaticId + i + 1,
          module: d.module,
          moduleColor: d.module_color,
          front: d.front,
          back: d.back,
          difficulty: d.difficulty as 'easy' | 'medium' | 'hard',
        }));

        setAllCards([...staticFlashcards, ...dynamicCards]);

        // Build dynamic modules
        const dynamicModuleNames = new Set(data.map(d => d.module));
        const existingModuleNames = new Set(staticModules.map(m => m.name));
        const newModules = Array.from(dynamicModuleNames)
          .filter(name => !existingModuleNames.has(name))
          .map(name => {
            const sample = data.find(d => d.module === name);
            const count = data.filter(d => d.module === name).length;
            return { name, color: sample?.module_color || 'primary', count };
          });

        setAllModules([...staticModules, ...newModules]);
      }
      setLoading(false);
    };

    fetchDynamic();
  }, []);

  return { allCards, allModules, loading };
}
