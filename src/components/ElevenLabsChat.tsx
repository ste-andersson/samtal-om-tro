
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useElevenLabs from "@/hooks/use-eleven-labs";
import MicrophonePermission from "./MicrophonePermission";
import ConversationControls from "./ConversationControls";
import DataCollectionDisplay from "./DataCollectionDisplay";
import TranscriptionDisplay from "./TranscriptionDisplay";

export const ElevenLabsChat = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const navigate = useNavigate();
  
  const {
    conversation,
    isStarted,
    isMuted,
    dataCollection,
    isLoadingData,
    savedToDatabase,
    messages,
    startConversation,
    toggleMute,
    conversationId
  } = useElevenLabs();

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

  // Log the current state values to debug navigation issues
  useEffect(() => {
    console.log("Conversation status:", status);
    console.log("Has saved to database:", savedToDatabase);
    console.log("Has data collection:", !!dataCollection);
    console.log("Conversation ID:", conversationId);
  }, [status, savedToDatabase, dataCollection, conversationId]);

  // Navigate to project details page when conversation ends and data is saved
  useEffect(() => {
    if (status === "disconnected" && conversationId) {
      console.log("Conversation ended, navigating to project details page");
      navigate(`/project-details/${conversationId}`);
    }
  }, [status, conversationId, navigate]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto">
      <MicrophonePermission permissionGranted={permissionGranted} />
      
      {permissionGranted !== false && (
        <>
          <ConversationControls 
            status={status}
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            isStarted={isStarted}
            permissionGranted={permissionGranted}
            onStart={startConversation}
            onToggleMute={toggleMute}
          />

          {/* Always show the TranscriptionDisplay when connected or if there are messages */}
          <TranscriptionDisplay messages={messages} />

          {(isLoadingData || dataCollection) && (
            <DataCollectionDisplay 
              data={dataCollection} 
              isLoading={isLoadingData}
              savedToDatabase={savedToDatabase} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default ElevenLabsChat;
