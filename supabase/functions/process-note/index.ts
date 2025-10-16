import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI study assistant. Extract key information from study materials and provide structured summaries, keywords, and mindmap data.'
          },
          {
            role: 'user',
            content: `Please analyze this study material titled "${title}":\n\n${text}\n\nProvide:\n1. A concise summary (2-3 paragraphs)\n2. 5-10 key keywords\n3. A mindmap structure with main topics and subtopics`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_study_note",
            description: "Create structured study notes",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Concise summary of the material" },
                keywords: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Important keywords and concepts"
                },
                mindmap: {
                  type: "object",
                  properties: {
                    nodes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          level: { type: "number" }
                        }
                      }
                    }
                  }
                }
              },
              required: ["summary", "keywords"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_study_note" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {
      summary: 'Could not generate summary',
      keywords: [],
      mindmap: null
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
