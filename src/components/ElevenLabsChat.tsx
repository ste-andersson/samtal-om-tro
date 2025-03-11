
import { useConversation } from "@11labs/react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DataCollectionDisplay, { DataCollection } from "./DataCollectionDisplay";
import { supabase } from "@/integrations/supabase/client";

export const ElevenLabsChat = () => {
  const { toast } = useToast();
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [dataCollection, setDataCollection] = useState<DataCollection | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState(false);

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
        console.log(`Conversation ended with ID: ${conversationIdRef.current}, saving data to database...`);
        saveConversationData(conversationIdRef.current);
      } else {
        console.error("No conversation ID available when disconnected");
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
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        
        if (!hasMicrophone) {
          console.log("No microphone detected");
          setPermissionGranted(false);
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("Microphone permission granted");
        setPermissionGranted(true);
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        setPermissionGranted(false);
      }
    };

    checkMicrophonePermission();
  }, []);

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
          closed: data.closed !== undefined ? data.closed : null
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

  const saveConversationData = async (id: string) => {
    console.log(`Creating data for conversation ID: ${id}`);
    setIsLoadingData(true);
    setDataCollection(null);
    setSavedToDatabase(false);
    
    try {
      // Create data directly
      const conversationData: DataCollection = { 
        project: "Voice Chat",
        summary: "Voice conversation with AI assistant",
        hours: new Date().toISOString(),
        closed: true
      };
      
      console.log("Saving conversation data for ID:", id, conversationData);
      const saved = await saveToDatabase(id, conversationData);
      
      if (saved) {
        console.log("Successfully saved data to database for conversation ID:", id);
        setDataCollection(conversationData);
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

  const startConversation = async () => {
    try {
      if (status === "connected") {
        console.log("Ending conversation session");
        // Save the data before ending the session if it hasn't been saved yet
        if (conversationIdRef.current && !savedToDatabase) {
          console.log("Saving data before ending session for ID:", conversationIdRef.current);
          await saveConversationData(conversationIdRef.current);
        }
        await conversation.endSession();
        setIsStarted(false);
        return;
      }

      console.log("Starting conversation session");
      // Clear previous conversation data
      setDataCollection(null);
      setSavedToDatabase(false);
      conversationIdRef.current = null;
      
      const result = await conversation.startSession({ 
        agentId: "w3YAPXpuEtNWtT2bqpKZ" 
      });
      
      console.log("Conversation started with ID:", result);
      // Store the conversation ID in the ref so it persists across renders
      conversationIdRef.current = result;
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

  if (permissionGranted === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Microphone Access Required</h2>
        <p className="text-gray-600 text-center">
          This feature requires microphone access to function. Please enable microphone access in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-6 p-6 bg-white rounded-lg shadow-md w-full">
        <div className="w-full flex justify-between items-center">
          <h2 className="text-2xl font-bold">Voice Assistant</h2>
          {status === "connected" && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
        </div>
        
        <div className={`w-full h-24 rounded-lg flex items-center justify-center transition-colors ${isSpeaking ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
          {isSpeaking ? (
            <div className="flex items-center space-x-2">
              <span className="animate-pulse text-blue-600">Assistant is speaking...</span>
            </div>
          ) : status === "connected" ? (
            <p className="text-gray-600">Listening for your voice...</p>
          ) : (
            <p className="text-gray-500">Press the button below to start</p>
          )}
        </div>

        <Button 
          className="w-full"
          onClick={startConversation}
          disabled={permissionGranted === null}
          variant={status === "connected" ? "destructive" : "default"}
        >
          {status === "connected" ? (
            <>
              <MicOff className="mr-2 h-5 w-5" /> End Conversation
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" /> Start Conversation
            </>
          )}
        </Button>
      </div>

      {(isLoadingData || dataCollection) && (
        <DataCollectionDisplay 
          data={dataCollection} 
          isLoading={isLoadingData}
          savedToDatabase={savedToDatabase} 
        />
      )}
    </div>
  );
};

export default ElevenLabsChat;
