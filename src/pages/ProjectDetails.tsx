
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProjectDetailsForm from "@/components/ProjectDetailsForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ProjectOption {
  uppdragsnr: string;
  kund: string;
}

const ProjectDetails = () => {
  const { conversationId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [data, setData] = useState<{
    project?: string;
    hours?: string;
    summary?: string;
    closed?: string;
    sales_opportunities?: string;
  } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch all required data when the component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      if (!conversationId) {
        toast({
          variant: "destructive",
          title: "Fel",
          description: "Konversations-ID saknas. Omdirigerar till startsidan.",
        });
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Fetch existing conversation data if available
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversation_data")
          .select("project, hours, summary, closed, sales_opportunities")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (conversationError) {
          console.error("Fel vid hämtning av konversationsdata:", conversationError);
          // Don't throw here, try to continue with other data
        }

        // 2. Fetch transcript
        const { data: transcriptData, error: transcriptError } = await supabase
          .from("conversation_transcripts")
          .select("transcript")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (transcriptError) {
          console.error("Fel vid hämtning av transkription:", transcriptError);
          // Don't throw here, try to continue with other data
        }

        // 3. Fetch available projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("uppdragsnr, kund")
          .order("uppdragsnr");

        if (projectsError) {
          console.error("Fel vid hämtning av projekt:", projectsError);
          // Don't throw here, use what we have
        }

        setData(conversationData || null);
        setTranscript(transcriptData?.transcript || null);
        setProjects(projectsData || []);
        
        // If we have a transcript but no data (or incomplete data), analyze automatically
        const shouldAnalyze = transcriptData?.transcript && 
          (!conversationData || !conversationData.project || !conversationData.hours);
        
        if (shouldAnalyze) {
          // We'll analyze in the next useEffect to ensure all state is updated
        } 
        
        setIsLoading(false);
      } catch (error) {
        console.error("Fel vid hämtning av data:", error);
        setError("Misslyckades med att ladda data. Försök igen.");
        toast({
          variant: "destructive",
          title: "Fel",
          description: "Misslyckades med att ladda data. Försök igen.",
        });
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [conversationId, toast, navigate]);

  // Automatically analyze transcript when needed
  useEffect(() => {
    const autoAnalyzeTranscript = async () => {
      if (!isLoading && transcript && projects.length > 0 && 
          (!data || !data.project || !data.hours)) {
        await analyzeTranscript();
      }
    };

    autoAnalyzeTranscript();
  }, [isLoading, transcript, projects, data]);

  const analyzeTranscript = async () => {
    if (!conversationId || !transcript) {
      return;
    }

    setIsAnalyzing(true);
    try {
      toast({
        title: "Analyserar",
        description: "Analyserar konversationstranskript...",
      });

      const { data: analysisResult, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { 
          transcript, 
          conversationId,
          projectOptions: projects 
        },
      });

      if (error) {
        console.error("Supabase-funktionsfel:", error);
        throw new Error(`Fel vid funktionsanrop: ${error.message}`);
      }

      if (!analysisResult) {
        throw new Error("Inget analysresultat returnerades");
      }

      console.log("Analysresultat:", analysisResult);

      // Update the form data with the analysis results
      setData({
        project: analysisResult.project || '',
        hours: analysisResult.hours?.toString() || '',
        summary: analysisResult.summary || '',
        closed: analysisResult.closed === 'yes' || analysisResult.closed === true ? 'yes' : 'no',
        sales_opportunities: analysisResult.sales_opportunities || '',
      });

      // Save the analyzed data to the database
      const { error: updateError } = await supabase
        .from("conversation_data")
        .upsert({
          conversation_id: conversationId,
          project: analysisResult.project,
          hours: analysisResult.hours?.toString(),
          summary: analysisResult.summary,
          closed: analysisResult.closed === 'yes' || analysisResult.closed === true ? 'yes' : 'no',
          sales_opportunities: analysisResult.sales_opportunities,
        });

      if (updateError) {
        console.error("Fel vid sparande av analys:", updateError);
        throw updateError;
      }

      toast({
        title: "Analys slutförd",
        description: "Formuläret har fyllts i med data från konversationen.",
      });
    } catch (error) {
      console.error("Fel vid analys av transkript:", error);
      toast({
        variant: "destructive",
        title: "Analysfel",
        description: "Misslyckades med att analysera konversationen. Försök igen.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle manual retry
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Fel</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isAnalyzing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Projektdetaljer</CardTitle>
          <CardDescription>
            Detaljer om projektet som diskuterades i din konversation.
            {isAnalyzing ? " Analyserar konversation..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectDetailsForm conversationId={conversationId || ""} initialData={data || undefined} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
