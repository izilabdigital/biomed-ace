import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contentType, moduleName, moduleColor, difficulty, count } = await req.json();

    // contentType: 'flashcards' | 'quiz' | 'exam' | 'wordsearch'
    if (!contentType || !moduleName) {
      return jsonResp({ error: 'contentType e moduleName são obrigatórios' }, 400);
    }

    // Get webhook URL from request or use default
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'https://n8n-n8n.xwskpb.easypanel.host/webhook/biocore-appz';

    console.log(`Generating ${contentType} for module "${moduleName}", difficulty: ${difficulty || 'all'}, count: ${count || 10}`);

    const payload = {
      action: 'generate',
      contentType,
      moduleName,
      moduleColor: moduleColor || 'primary',
      difficulty: difficulty || 'all',
      count: count || 10,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`Webhook error ${response.status}: ${text}`);
      return jsonResp({ error: `Webhook retornou erro ${response.status}` }, 502);
    }

    const data = await response.json();
    console.log('Webhook response received:', JSON.stringify(data).substring(0, 500));

    return jsonResp({ success: true, data });
  } catch (error) {
    console.error('Error in generate-content:', error);
    return jsonResp({ error: error.message }, 500);
  }
});

function jsonResp(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
