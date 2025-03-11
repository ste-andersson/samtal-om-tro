
import { useConversation } from "@11labs/react";
import { useEffect, useState } from "react";
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      toast({
        title: "Connected to AI assistant",
        description: "You can now start a conversation with the assistant",
      });
    },
    onDisconnect: () => {
      setIsStarted(false);
      toast({
        title: "Disconnected from AI assistant",
        description: "The conversation has ended",
      });
      
      // Fetch data collection after conversation ends
      if (conversationId) {
        fetchDataCollection(conversationId);
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
          setPermissionGranted(false);
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        setPermissionGranted(false);
      }
    };

    checkMicrophonePermission();
  }, []);

  // Save data to Supabase
  const saveToDatabase = async (id: string, data: DataCollection) => {
    try {
      const { error } = await supabase
        .from('conversation_data')
        .insert({
          conversation_id: id,
          project: data.project || null,
          hours: data.hours || null,
          summary: data.summary || null,
          closed: data.closed !== undefined ? data.closed : null
        });

      if (error) {
        console.error("Error saving to database:", error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: "Failed to save conversation data to database",
        });
        return false;
      }

      toast({
        title: "Saved to Database",
        description: "Conversation data has been saved successfully",
      });
      return true;
    } catch (error) {
      console.error("Error in saveToDatabase:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "An unexpected error occurred while saving data",
      });
      return false;
    }
  };

  const fetchDataCollection = async (id: string) => {
    setIsLoadingData(true);
    setDataCollection(null);
    setSavedToDatabase(false);
    
    // Implement polling since the data might not be available immediately
    let attempts = 0;
    const maxAttempts = 5; // Try up to 5 times
    const pollInterval = 3000; // 3 seconds between attempts
    
    const pollForData = async () => {
      if (attempts >= maxAttempts) {
        console.log(`Max attempts (${maxAttempts}) reached. Saving minimal data.`);
        setIsLoadingData(false);
        
        // Even if data collection fails, save at least the conversation ID
        const minimalData: DataCollection = { 
          project: "Unknown",
          summary: "Data collection unavailable"
        };
        
        setDataCollection(minimalData);
        const saved = await saveToDatabase(id, minimalData);
        setSavedToDatabase(saved);
        
        toast({
          variant: "warning",
          title: "Limited data collected",
          description: "Could not retrieve detailed conversation data, but saved basic information.",
        });
        return;
      }
      
      try {
        console.log(`Attempt ${attempts + 1}/${maxAttempts} to fetch data collection for ID: ${id}`);
        const apiKey = process.env.ELEVEN_LABS_API_KEY || '';
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/${id}/data-collection`, {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Data collection response:", data);
          
          // Extract the specific fields we need
          const collectedData: DataCollection = {
            project: data.items?.find((item: any) => item.id === 'project')?.value,
            hours: data.items?.find((item: any) => item.id === 'hours')?.value,
            summary: data.items?.find((item: any) => item.id === 'summary')?.value,
            closed: data.items?.find((item: any) => item.id === 'closed')?.value,
          };
          
          // Check if we have at least one piece of data
          if (Object.values(collectedData).some(value => value !== undefined)) {
            setDataCollection(collectedData);
            setIsLoadingData(false);
            
            // Save to Supabase
            const saved = await saveToDatabase(id, collectedData);
            setSavedToDatabase(saved);
          } else {
            // If no data is found yet, try again
            attempts++;
            setTimeout(pollForData, pollInterval);
          }
        } else {
          console.error(`API error: ${response.status} ${response.statusText}`);
          // If API returns error, wait and try again
          attempts++;
          setTimeout(pollForData, pollInterval);
        }
      } catch (error) {
        console.error("Error fetching data collection:", error);
        attempts++;
        setTimeout(pollForData, pollInterval);
      }
    };
    
    // Start the polling process
    pollForData();
  };

  const startConversation = async () => {
    try {
      if (status === "connected") {
        await conversation.endSession();
        setIsStarted(false);
        return;
      }

      const result = await conversation.startSession({ 
        agentId: "w3YAPXpuEtNWtT2bqpKZ" 
      });
      
      console.log("Conversation started with ID:", result);
      setConversationId(result);
      setIsStarted(true);
      setDataCollection(null);
      setSavedToDatabase(false);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start the conversation. Please try again.",
      });
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1.0 : 0.0 });
      setIsMuted(!isMuted);
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

      {/* Data Collection Display */}
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
