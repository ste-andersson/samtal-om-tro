import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { transcript, case_id, defects } = await req.json();
    
    if (!transcript || !case_id || !defects) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: transcript, case_id, defects' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing defects for case:', case_id, 'with', defects.length, 'defects');

    // Create defects context for the prompt
    const defectsContext = defects.map((defect: any) => 
      `Defect ${defect.defect_number}: ${defect.description}`
    ).join('\n');

    const systemPrompt = `Du ska skapa en json-fil för uppdatering av protokoll för brandskyddstillsyn. För varje defect_number ska du välja en standardtext för brist, en standardtext för åtgärd och en standardtext för motivering. Om det finns * i texten ska du byta ut * mot en formulering som passar i texten och som är det användaren talade om.

Här är standardtexterna:

Vägledande markeringar

Brist A - "Vägledande markeringar saknas *beskriv var de saknas*.

Utrymning från utrymmen där personer inte är kända i lokalerna tar längre tid om vägledande markeringar saknas."

Brist B - "Vägledande markeringar *beskriv var de saknades* var släckta vid tillsynsbesöket.

Utrymning från utrymmen där personer inte är kända i lokalerna tar längre tid om vägledande markeringar saknas."

Åtgärd A - "Vägledande markeringar som visar vägen ut ska monteras ovanför dörrar. Markeringarna ska utformas belysta/genomlysta. Skyltar ska vara utformade i enlighet med SS-EN 1838:2013*Lägg till och AFS 2023:12 om det är en arbetsplats*.

Åtgärd B - "De vägledande markeringarna som vid tillsynsbesöket var släckta ska åtgärdas så att de lyser."

Motivering - "Syftet med åtgärden är att underlätta vid utrymning. Personerna som utrymmer ska i dåliga förhållanden (mörker eller tät brandrök) kunna lokalisera var närmsta utgång finns. Vägledande markeringar gör det möjligt att genomföra detta skyndsamt. *Beskriv varför utrymmet kan vara svårorienterat (tex långa gångavstånd, dåligt med dagljusinsläpp, folk är inte bekanta i lokalerna, många vägval, möblering som gör det svårt att gå på måfå för att hitta ut osv…)*

Dörr i brandcellsgräns

Brist - 'Dörrparti i brandcellsgräns *beskriv var i lokalen* uppfyller inte sin brandtekniska funktion. Vid tillsynen noterades att partiet *beskriv var på dörren* inte var tätt/inte innehar korrekt brandklassning p.g.a. *ange vad som gör att det är en brist, exempelvis glipa eller hål*. Det är placerat i en brandcellsgräns och kan i sin nuvarande utformning inte tillräckligt väl förhindra spridning av brand och rök till angränsande utrymme.

Åtgärd - 'Dörren ska åtgärdas så att erforderlig brandteknisk klass uppnås. Detta kan utföras på två olika sätt:

a) Åtgärder vidtas så att befintligt dörrparti lägst motsvarar brandteknisk klass *skriv in klass eller orden FYLL I*. Att vidtagna åtgärder leder till att angiven brandteknisk funktion har uppnåtts ska verifieras av sakkunnig.

b) Dörrpartiet ersätts med nytt i lägst brandteknisk klass *skriv in klass eller orden FYLL I*.'

Motivering - 'Det brandskydd som finns installerat i en byggnad måste underhållas för att det ska uppnå sin tänkta effekt. Med angiven åtgärd ges fastighetsägaren möjlighet att välja vilket alternativ som passar bäst i aktuell verksamhet.'

Analysera transkriptionen och tillgängliga bristbeskrivningar för att välja lämpliga standardtexter och fyll i * med specifika detaljer från konversationen.

Returnera endast en giltig JSON enligt detta format:
{
  "defects": [
    {
      "case_id": "case_id_här",
      "defect_number": defect_number_här,
      "brist": "standardtext för brist med * utbytt mot specifika detaljer",
      "atgard": "standardtext för åtgärd med * utbytt mot specifika detaljer", 
      "motivering": "standardtext för motivering med * utbytt mot specifika detaljer"
    }
  ]
}`;

    const userPrompt = `TRANSKRIPTION:
${transcript}

BEFINTLIGA BRISTER ATT ANALYSERA:
${defectsContext}

CASE_ID: ${case_id}

Analysera transkriptionen och skapa JSON med standardtexter för varje brist där * ersätts med specifika detaljer från konversationen.`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = data.choices[0].message.content;
    let analysisResult;

    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('OpenAI returned invalid JSON');
    }

    // Validate the response structure
    if (!analysisResult.defects || !Array.isArray(analysisResult.defects)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure all defects have the required case_id
    analysisResult.defects = analysisResult.defects.map((defect: any) => ({
      ...defect,
      case_id: case_id // Ensure consistency
    }));

    console.log('Defect analysis completed for', analysisResult.defects.length, 'defects');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-defects function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});