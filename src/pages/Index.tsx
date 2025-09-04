import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { AudioRecorder } from '@/components/AudioRecorder';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Navigation } from '@/components/Navigation';
import { AgentSelector } from '@/components/AgentSelector';
import useElevenLabs from "@/hooks/use-eleven-labs";
import MicrophonePermission from "@/components/MicrophonePermission";

const Index = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [selectedAgent, setSelectedAgent] = useState("agent_2401k467207hefr83sq8vsfkj5ys");
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  console.log("Index component rendering with selectedAgent:", selectedAgent);
  
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
  } = useElevenLabs(selectedAgent);

  const { status, isSpeaking } = conversation;

  // Hantera AI-processar timing
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Om det senaste meddelandet är från användaren
    if (lastMessage.role === 'user') {
      // Rensa eventuell befintlig timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Starta timeout för att visa "AI-processar" efter 100ms
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(true);
      }, 100);
    }
    
    // Om det senaste meddelandet är från AI, dölj "AI-processar"
    if (lastMessage.role === 'assistant') {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      setIsProcessing(false);
    }

    // Cleanup function
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [messages]);

  // Rensa processing när konversation startar om
  useEffect(() => {
    if (!isStarted) {
      setIsProcessing(false);
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    }
  }, [isStarted]);

  // Check microphone permission
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

  // Navigate to project details page when conversation ends and data is saved
  // useEffect(() => {
  //   if (status === "disconnected" && conversationId) {
  //     console.log("Conversation ended, navigating to project details page");
  //     navigate(`/project-details/${conversationId}`);
  //   }
  // }, [status, conversationId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        {/* Header med exakt denna titel */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-poppins font-extrabold mb-6 text-primary">
            Tillsyns-assistenten
          </h1>
        </header>

        <MicrophonePermission permissionGranted={permissionGranted} />

        {permissionGranted !== false && (
          <main className="space-y-12">
            {/* Controls Section - ConnectionStatus TILL VÄNSTER, AudioRecorder TILL HÖGER */}
            <div className="flex justify-center items-center gap-8">
              <ConnectionStatus 
                status={status}
                isSpeaking={isSpeaking}
              />
              <AudioRecorder 
                status={status}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
                isStarted={isStarted}
                permissionGranted={permissionGranted}
                onStart={startConversation}
                onToggleMute={toggleMute}
              />
            </div>

            {/* Conversation Display - centrerat under */}
            <div className="flex justify-center">
              <ConversationDisplay 
                messages={messages} 
                isProcessing={isProcessing}
              />
            </div>

            {/* Agent Selector */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <AgentSelector 
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  disabled={isStarted}
                />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default Index;