
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
          title: "Error",
          description: "Conversation ID is missing. Redirecting to home page.",
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
          .select("project, hours, summary, closed")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (conversationError) {
          console.error("Error fetching conversation data:", conversationError);
          // Don't throw here, try to continue with other data
        }

        // 2. Fetch transcript
        const { data: transcriptData, error: transcriptError } = await supabase
          .from("conversation_transcripts")
          .select("transcript")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (transcriptError) {
          console.error("Error fetching transcript:", transcriptError);
          // Don't throw here, try to continue with other data
        }

        // 3. Fetch available projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("uppdragsnr, kund")
          .order("uppdragsnr");

        if (projectsError) {
          console.error("Error fetching projects:", projectsError);
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
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
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
        title: "Analyzing",
        description: "Analyzing conversation transcript...",
      });

      const { data: analysisResult, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { 
          transcript, 
          conversationId,
          projectOptions: projects 
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Function invocation error: ${error.message}`);
      }

      if (!analysisResult) {
        throw new Error("No analysis result returned");
      }

      console.log("Analysis result:", analysisResult);

      // Update the form data with the analysis results
      setData({
        project: analysisResult.project || '',
        hours: analysisResult.hours?.toString() || '',
        summary: analysisResult.summary || '',
        closed: analysisResult.closed === 'yes' || analysisResult.closed === true ? 'yes' : 'no',
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
        });

      if (updateError) {
        console.error("Error saving analysis:", updateError);
        throw updateError;
      }

      toast({
        title: "Analysis Complete",
        description: "The form has been populated with data from the conversation.",
      });
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Failed to analyze the conversation. Please try again.",
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
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
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
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Details about the project discussed in your conversation.
            {isAnalyzing ? " Analyzing conversation..." : ""}
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
