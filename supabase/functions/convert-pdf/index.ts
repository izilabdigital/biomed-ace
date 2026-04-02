import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pdfText, moduleName, moduleColor } = await req.json();

    if (!pdfText || !moduleName) {
      return new Response(JSON.stringify({ error: "pdfText and moduleName are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedText = pdfText.substring(0, 25000);

    // ─── 1. Generate Flashcards ───
    const flashcardsResponse = await callAI(LOVABLE_API_KEY, {
      system: `Você é um especialista em criar material de estudo para biomedicina e anatomia. 
Dado o texto de um PDF acadêmico, gere flashcards de estudo.

REGRAS:
- Gere entre 30 e 50 flashcards
- Cada flashcard deve ter: front (pergunta), back (resposta), difficulty (easy/medium/hard)
- Distribua as dificuldades: ~30% easy, ~40% medium, ~30% hard
- As perguntas devem cobrir conceitos-chave, definições, classificações e relações
- As respostas devem ser completas mas concisas
- Use linguagem acadêmica em português brasileiro

Responda APENAS com o JSON, sem markdown.`,
      user: `Gere flashcards a partir deste conteúdo do módulo "${moduleName}":\n\n${truncatedText}`,
      toolName: "generate_flashcards",
      toolDesc: "Generate flashcards from academic content",
      parameters: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              },
              required: ["front", "back", "difficulty"],
            },
          },
        },
        required: ["flashcards"],
      },
    });

    if (!flashcardsResponse.ok) {
      const status = flashcardsResponse.status;
      const errText = await flashcardsResponse.text();
      console.error("AI flashcards error:", status, errText);
      if (status === 429) return jsonResp({ error: "Rate limit exceeded" }, 429);
      if (status === 402) return jsonResp({ error: "AI credits exhausted" }, 402);
      return jsonResp({ error: "AI flashcard generation failed" }, 500);
    }

    const flashcardsData = await flashcardsResponse.json();
    const flashcardsTool = flashcardsData.choices?.[0]?.message?.tool_calls?.[0];
    const { flashcards } = JSON.parse(flashcardsTool?.function?.arguments || '{"flashcards":[]}');

    // ─── 2. Generate Quiz/Exam Questions ───
    const questionsResponse = await callAI(LOVABLE_API_KEY, {
      system: `Você é um especialista em criar questões de prova e quiz para biomedicina e anatomia.
Dado o texto de um PDF acadêmico, gere questões de múltipla escolha.

REGRAS:
- Gere 15 questões de quiz (mais curtas, diretas) e 10 questões de prova (mais elaboradas, com raciocínio)
- Cada questão deve ter: question_text, options (array de 4 strings), correct_index (0-3), explanation, question_type (quiz ou exam), difficulty (easy/medium/hard)
- As questões de prova devem exigir mais raciocínio e ter explicações detalhadas
- As opções incorretas devem ser plausíveis (distratores bem construídos)
- Use linguagem acadêmica em português brasileiro`,
      user: `Gere questões a partir deste conteúdo do módulo "${moduleName}":\n\n${truncatedText}`,
      toolName: "generate_questions",
      toolDesc: "Generate quiz and exam questions from academic content",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_text: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "integer" },
                explanation: { type: "string" },
                question_type: { type: "string", enum: ["quiz", "exam"] },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              },
              required: ["question_text", "options", "correct_index", "explanation", "question_type", "difficulty"],
            },
          },
        },
        required: ["questions"],
      },
    });

    let questions: any[] = [];
    if (questionsResponse.ok) {
      const qData = await questionsResponse.json();
      const qTool = qData.choices?.[0]?.message?.tool_calls?.[0];
      const parsed = JSON.parse(qTool?.function?.arguments || '{"questions":[]}');
      questions = parsed.questions || [];
    } else {
      console.error("AI questions error:", questionsResponse.status, await questionsResponse.text());
    }

    // ─── 3. Generate Word Search Words ───
    const wordsResponse = await callAI(LOVABLE_API_KEY, {
      system: `Você é um especialista em biomedicina e anatomia.
Dado o texto de um PDF acadêmico, extraia palavras-chave importantes para um caça-palavras educativo.

REGRAS:
- Extraia entre 10 e 20 palavras-chave
- Cada palavra deve ter: word (apenas uma palavra, sem espaços, em MAIÚSCULAS), explanation (explicação clara e didática do conceito)
- As palavras devem ter entre 4 e 12 letras
- Priorize termos técnicos importantes do conteúdo
- Use linguagem acadêmica em português brasileiro
- NÃO inclua palavras com acentos, cedilha ou caracteres especiais - use apenas A-Z`,
      user: `Extraia palavras-chave para caça-palavras do módulo "${moduleName}":\n\n${truncatedText}`,
      toolName: "generate_words",
      toolDesc: "Generate word search words from academic content",
      parameters: {
        type: "object",
        properties: {
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["word", "explanation"],
            },
          },
        },
        required: ["words"],
      },
    });

    let words: any[] = [];
    if (wordsResponse.ok) {
      const wData = await wordsResponse.json();
      const wTool = wData.choices?.[0]?.message?.tool_calls?.[0];
      const parsed = JSON.parse(wTool?.function?.arguments || '{"words":[]}');
      words = parsed.words || [];
    } else {
      console.error("AI words error:", wordsResponse.status, await wordsResponse.text());
    }

    // ─── Insert all data ───
    const color = moduleColor || "primary";

    // Flashcards
    if (flashcards.length > 0) {
      const rows = flashcards.map((fc: any) => ({
        module: moduleName, module_color: color,
        front: fc.front, back: fc.back, difficulty: fc.difficulty,
        created_by: user.id,
      }));
      const { error } = await supabase.from("dynamic_flashcards").insert(rows);
      if (error) console.error("Insert flashcards error:", error);
    }

    // Questions
    if (questions.length > 0) {
      const qRows = questions.map((q: any) => ({
        module: moduleName, module_color: color,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        question_type: q.question_type,
        difficulty: q.difficulty,
        created_by: user.id,
      }));
      const { error } = await supabase.from("dynamic_questions").insert(qRows);
      if (error) console.error("Insert questions error:", error);
    }

    // Word search words
    if (words.length > 0) {
      const wRows = words.map((w: any) => ({
        module: moduleName, module_color: color,
        word: w.word.toUpperCase().replace(/[^A-Z]/g, ''),
        explanation: w.explanation,
        created_by: user.id,
      }));
      const validWords = wRows.filter((w: any) => w.word.length >= 4 && w.word.length <= 12);
      if (validWords.length > 0) {
        const { error } = await supabase.from("word_search_words").insert(validWords);
        if (error) console.error("Insert words error:", error);
      }
    }

    // Track upload
    await supabase.from("content_uploads").insert({
      file_name: `${moduleName}.pdf`,
      module_name: moduleName,
      module_color: color,
      status: "completed",
      cards_generated: flashcards.length,
      uploaded_by: user.id,
    });

    return jsonResp({
      success: true,
      cardsGenerated: flashcards.length,
      questionsGenerated: questions.length,
      wordsGenerated: words.length,
      moduleName,
    }, 200);

  } catch (e) {
    console.error("Error:", e);
    return jsonResp({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function jsonResp(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(apiKey: string, opts: { system: string; user: string; toolName: string; toolDesc: string; parameters: any }) {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      tools: [{
        type: "function",
        function: {
          name: opts.toolName,
          description: opts.toolDesc,
          parameters: opts.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: opts.toolName } },
    }),
  });
}
