
import { useConversation } from "@11labs/react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DataCollection } from "@/components/DataCollectionDisplay";
import { useCase } from "@/contexts/CaseContext";

type Message = {
  role: string;
  content: string;
};

export const useElevenLabs = () => {
  const { toast } = useToast();
  const { selectedCase } = useCase();
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dataCollection, setDataCollection] = useState<DataCollection | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [transcriptionSaved, setTranscriptionSaved] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const saveTranscription = async (id: string) => {
    if (!messages.length) {
      console.log("No messages to save as transcription");
      return;
    }

    // If transcription is already saved for this conversation, don't save it again
    if (transcriptionSaved && id === conversationIdRef.current) {
      console.log("Transcription already saved for this conversation");
      return;
    }

    try {
      const transcriptText = messages.map(msg => 
        `${msg.role === 'assistant' ? 'A' : 'You'}: ${msg.content}`
      ).join('\n\n');

      console.log("Saving transcription:", {
        conversation_id: id,
        transcript: transcriptText
      });
      
      const { error } = await supabase
        .from('conversation_transcripts')
        .insert({
          conversation_id: id,
          transcript: transcriptText
        });

      if (error) {
        console.error("Error saving transcription:", error);
        toast({
          variant: "destructive",
          title: "Transcription Error",
          description: "Failed to save conversation transcription",
        });
        return;
      }

      console.log("Transcription saved successfully");
      setTranscriptionSaved(true);
      toast({
        title: "Transcription Saved",
        description: "Conversation transcription has been saved to database",
      });

      // Trigger defect analysis after successful transcription save
      if (selectedCase?.id) {
        console.log("Starting defect analysis after transcription save");
        analyzeDefects(transcriptText, id);
      }
    } catch (error) {
      console.error("Exception saving transcription:", error);
      toast({
        variant: "destructive",
        title: "Transcription Error",
        description: "An unexpected error occurred while saving transcription",
      });
    }
  };

  const saveConversationData = async (id: string, data: DataCollection) => {
    console.log(`Creating data for conversation ID: ${id}`, data);
    setIsLoadingData(true);
    setSavedToDatabase(false);
    
    try {
      if (data && Object.values(data).some(val => val !== null)) {
        console.log("Using data for conversation ID:", id, data);
        const saved = await saveToDatabase(id, data);
        
        if (saved) {
          console.log("Successfully saved data to database for conversation ID:", id);
          setSavedToDatabase(true);
          toast({
            title: "Conversation Saved",
            description: `Conversation (ID: ${id.substring(0, 8)}...) has been saved to database.`,
          });
        } else {
          console.error("Failed to save data to database for conversation ID:", id);
          toast({
            variant: "destructive",
            title: "Save Error",
            description: "Failed to save conversation data.",
          });
        }
      } else {
        console.error("No data available to save for ID:", id);
        toast({
          variant: "destructive",
          title: "Data Missing",
          description: "No data available to save.",
        });
      }
    } catch (error) {
      console.error("Error in saveConversationData:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process conversation data.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const saveToDatabase = async (id: string, data: DataCollection) => {
    console.log("Attempting to save to database:", { id, data });
    try {
      const { error, data: result } = await supabase
        .from('conversation_data')
        .insert({
          conversation_id: id,
          project: data.project || null,
          hours: data.hours || null,
          summary: data.summary || null,
          closed: data.closed || null
        });

      if (error) {
        console.error("Supabase error saving to database:", error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: "Failed to save conversation data to database",
        });
        return false;
      }

      console.log("Successfully saved to database:", result);
      toast({
        title: "Saved to Database",
        description: "Conversation data has been saved successfully",
      });
      return true;
    } catch (error) {
      console.error("Exception in saveToDatabase:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "An unexpected error occurred while saving data",
      });
      return false;
    }
  };

  const analyzeDefects = async (transcript: string, conversationId: string) => {
    if (!selectedCase?.id) {
      console.log("No selected case for defect analysis");
      return;
    }

    try {
      console.log("Starting defect analysis for case:", selectedCase.id);
      
      // Fetch existing defects for the case
      const { data: defects, error: fetchError } = await supabase
        .from('case_defects')
        .select('defect_number, description')
        .eq('case_id', selectedCase.id)
        .order('defect_number', { ascending: true });

      if (fetchError) {
        console.error("Error fetching defects:", fetchError);
        return;
      }

      if (!defects || defects.length === 0) {
        console.log("No defects found for analysis");
        return;
      }

      console.log("Analyzing", defects.length, "defects");

      // Call the analyze-defects edge function
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-defects', {
        body: {
          transcript,
          case_id: selectedCase.id,
          defects
        }
      });

      if (analysisError) {
        console.error("Error analyzing defects:", analysisError);
        toast({
          variant: "destructive",
          title: "Analys fel",
          description: "Kunde inte analysera brister med AI",
        });
        return;
      }

      if (!analysisResult?.defects || !Array.isArray(analysisResult.defects)) {
        console.error("Invalid analysis result:", analysisResult);
        return;
      }

      // Update defects with the analyzed data
      for (const defect of analysisResult.defects) {
        const { error: updateError } = await supabase
          .from('case_defects')
          .update({
            brist: defect.brist,
            atgard: defect.atgard,
            motivering: defect.motivering
          })
          .eq('case_id', defect.case_id)
          .eq('defect_number', defect.defect_number);

        if (updateError) {
          console.error("Error updating defect:", defect.defect_number, updateError);
        } else {
          console.log("Updated defect", defect.defect_number, "successfully");
        }
      }

      toast({
        title: "Brister analyserade",
        description: `${analysisResult.defects.length} brister har analyserats och uppdaterats med AI`,
      });

    } catch (error) {
      console.error("Exception in analyzeDefects:", error);
      toast({
        variant: "destructive",
        title: "Analys fel",
        description: "Ett oväntat fel inträffade vid bristanalys",
      });
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to AI assistant");
      toast({
        title: "Connected to AI assistant",
        description: "You can now start a conversation with the assistant",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from AI assistant");
      setIsStarted(false);
      toast({
        title: "Disconnected from AI assistant",
        description: "The conversation has ended",
      });
      
      if (conversationIdRef.current) {
        console.log(`Conversation ended with ID: ${conversationIdRef.current}`);
        
        if (messages.length > 0) {
          console.log("Saving transcription for messages:", messages);
          saveTranscription(conversationIdRef.current);
        }
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error connecting to the assistant",
      });
      setIsStarted(false);
    },
    onMessage: (message) => {
      console.log("Received message:", message);
      
      if (message.type === "data_collection") {
        console.log("Received data collection:", message);
        if (message.data) {
          const collectedData: DataCollection = {
            project: message.data.project || null,
            hours: message.data.hours || null,
            summary: message.data.summary || null,
            closed: message.data.closed || null
          };
          console.log("Setting data collection:", collectedData);
          setDataCollection(collectedData);
          
          if (conversationIdRef.current) {
            saveConversationData(conversationIdRef.current, collectedData);
          }
        }
      } else if (message.type === "llm_response" || message.type === "voice_response") {
        const assistantMessage = { role: "assistant", content: message.text || "" };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (message.type === "user_response") {
        const userMessage = { role: "user", content: message.message || "" };
        setMessages(prev => [...prev, userMessage]);
      } else if (message.source === "ai") {
        const assistantMessage = { role: "assistant", content: message.message || "" };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (message.source === "user") {
        const userMessage = { role: "user", content: message.message || "" };
        setMessages(prev => [...prev, userMessage]);
      }
    }
  });

  // Ensure we detect disconnections by monitoring the status
  useEffect(() => {
    if (conversation.status === "disconnected" && isStarted) {
      setIsStarted(false);
      console.log("Status changed to disconnected - ensure navigation happens");
      
      // If we have a conversation ID and there are messages, save the transcription
      if (conversationIdRef.current && messages.length > 0 && !transcriptionSaved) {
        console.log("Saving transcription on disconnect status change");
        saveTranscription(conversationIdRef.current);
      }
    }
  }, [conversation.status, isStarted, messages, transcriptionSaved]);

  // Add a separate effect to save transcription when messages change
  // This is a safety measure in case the onDisconnect callback doesn't fire
  useEffect(() => {
    if (conversationIdRef.current && 
        messages.length > 0 && 
        conversation.status === "disconnected" && 
        !transcriptionSaved) {
      console.log("Saving transcription after messages updated and conversation disconnected");
      saveTranscription(conversationIdRef.current);
    }
  }, [messages, conversation.status, transcriptionSaved]);

  const startConversation = async () => {
    try {
      if (conversation.status === "connected") {
        console.log("Ending conversation session");
        
        if (conversationIdRef.current && !transcriptionSaved && messages.length > 0) {
          await saveTranscription(conversationIdRef.current);
        }
        
        await conversation.endSession();
        setIsStarted(false);
        return;
      }

      console.log("Starting conversation session");
      setDataCollection(null);
      setSavedToDatabase(false);
      setMessages([]);
      setTranscriptionSaved(false);
      conversationIdRef.current = null;
      setConversationId(null);
      
      const result = await conversation.startSession({ 
        agentId: "agent_2401k467207hefr83sq8vsfkj5ys" 
      });
      
      console.log("Conversation started with ID:", result);
      conversationIdRef.current = result;
      setConversationId(result);
      setIsStarted(true);
    } catch (error) {
      console.error("Error starting/ending conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start/end the conversation. Please try again.",
      });
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1.0 : 0.0 });
      setIsMuted(!isMuted);
      console.log(`Volume ${isMuted ? 'unmuted' : 'muted'}`);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  return {
    conversation,
    isStarted,
    isMuted,
    dataCollection,
    isLoadingData,
    savedToDatabase,
    messages,
    startConversation,
    toggleMute,
    conversationId: conversationId
  };
};

export default useElevenLabs;
