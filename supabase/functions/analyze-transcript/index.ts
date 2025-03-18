
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY är inte inställd')
    }

    const requestBody = await req.json().catch(err => {
      console.error("Misslyckades med att tolka request body:", err);
      throw new Error('Ogiltig JSON i request body');
    });
    
    const { transcript, conversationId, projectOptions } = requestBody;

    if (!transcript || !conversationId) {
      throw new Error('Saknar nödvändiga parametrar: transcript eller conversationId')
    }

    console.log(`Bearbetar transkriptionsanalys för konversation: ${conversationId}`)
    console.log(`Tillgängliga projektalternativ: ${JSON.stringify(projectOptions)}`)
    
    // Prepare the system message with project options if available
    let systemContent = `Du är en assistent som extraherar strukturerad data från konversationstranskript.
            Extrahera följande information från transkriptet:
            - Projektnummer (format som "12345")
            - Rapporterade timmar (ett nummer)
            - Sammanfattning av vad som diskuterades/rapporterades
            - Om ärendet ska markeras som avslutat (ja/nej)`
    
    // Add project options context if available
    if (projectOptions && projectOptions.length > 0) {
      systemContent += `\n\nFör projektet, välj det bäst matchande alternativet från denna lista:
${projectOptions.map(p => `- ${p.uppdragsnr} - ${p.kund}`).join('\n')}

Välj det projektnummer som bäst matchar det som nämns i transkriptet. Om inget matchar, ange bara det projektnummer som nämns i transkriptet.`
    }
    
    systemContent += `\nFormatera ditt svar som ett JSON-objekt med nycklarna: project, hours, summary, closed`
    
    console.log("Skickar förfrågan till OpenAI med systeminnehåll:", systemContent);
    
    // Query OpenAI to analyze the transcript
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API-fel (${response.status}):`, errorText);
      throw new Error(`OpenAI API-fel: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI-svar:', JSON.stringify(data));

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Ogiltig svarsstruktur från OpenAI:', data);
      throw new Error('Ogiltigt svar från OpenAI');
    }

    // Parse the JSON response from OpenAI
    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
      console.log('Extraherad data:', analysisResult);
    } catch (parseError) {
      console.error('Misslyckades med att tolka OpenAI-svar som JSON:', parseError, data.choices[0].message.content);
      throw new Error('Misslyckades med att tolka OpenAI-svar');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Fel i analyze-transcript-funktionen:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
