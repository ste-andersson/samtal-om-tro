
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
      throw new Error('OPENAI_API_KEY is not set')
    }

    const requestBody = await req.json().catch(err => {
      console.error("Failed to parse request body:", err);
      throw new Error('Invalid JSON in request body');
    });
    
    const { transcript, conversationId, projectOptions } = requestBody;

    if (!transcript || !conversationId) {
      throw new Error('Missing required parameters: transcript or conversationId')
    }

    console.log(`Processing transcript analysis for conversation: ${conversationId}`)
    console.log(`Available project options: ${JSON.stringify(projectOptions)}`)
    
    // Prepare the system message with project options if available
    let systemContent = `You are an assistant that extracts structured data from conversation transcripts.
            Extract the following information from the transcript:
            - Project number (format like "12345")
            - Hours reported (a number)
            - Summary of what was discussed/reported
            - Whether the case should be marked as closed (yes/no)`
    
    // Add project options context if available
    if (projectOptions && projectOptions.length > 0) {
      systemContent += `\n\nFor the project, select the best matching option from this list:
${projectOptions.map(p => `- ${p.uppdragsnr} - ${p.kund}`).join('\n')}

Choose the project number that most closely matches what's mentioned in the transcript. If nothing matches, just provide the project number mentioned in the transcript.`
    }
    
    systemContent += `\nFormat your response as a JSON object with keys: project, hours, summary, closed`
    
    console.log("Sending request to OpenAI with system content:", systemContent);
    
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
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI:', data);
      throw new Error('Invalid response from OpenAI');
    }

    // Parse the JSON response from OpenAI
    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
      console.log('Extracted data:', analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError, data.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in analyze-transcript function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
