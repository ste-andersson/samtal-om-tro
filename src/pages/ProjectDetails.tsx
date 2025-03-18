
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProjectDetailsForm from "@/components/ProjectDetailsForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ProjectDetails = () => {
  const { conversationId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<{
    project?: string;
    hours?: string;
    summary?: string;
    closed?: string;
  } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversationData = async () => {
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
        // Fetch existing conversation data if available
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversation_data")
          .select("project, hours, summary, closed")
          .eq("conversation_id", conversationId)
          .single();

        if (conversationError && conversationError.code !== 'PGRST116') {
          throw conversationError;
        }

        // Fetch transcript
        const { data: transcriptData, error: transcriptError } = await supabase
          .from("conversation_transcripts")
          .select("transcript")
          .eq("conversation_id", conversationId)
          .single();

        if (transcriptError && transcriptError.code !== 'PGRST116') {
          throw transcriptError;
        }

        setData(conversationData || null);
        setTranscript(transcriptData?.transcript || null);
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load conversation data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversationData();
  }, [conversationId, toast, navigate]);

  const analyzeTranscript = async () => {
    if (!conversationId || !transcript) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No transcript available for analysis.",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      toast({
        title: "Analyzing",
        description: "Analyzing conversation transcript...",
      });

      const { data: analysisResult, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript, conversationId },
      });

      if (error) throw error;

      if (analysisResult) {
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

        if (updateError) throw updateError;

        toast({
          title: "Analysis Complete",
          description: "The form has been populated with data from the conversation.",
        });
      }
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

  if (isLoading) {
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
            Please fill in the details about the project discussed in your conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectDetailsForm conversationId={conversationId || ""} initialData={data || undefined} />
        </CardContent>
        {transcript && (
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button 
              onClick={analyzeTranscript} 
              disabled={isAnalyzing}
              className="w-full md:w-auto"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Conversation with AI"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProjectDetails;
