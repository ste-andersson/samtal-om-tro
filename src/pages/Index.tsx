import { useState, useEffect, useRef } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { AgentSelector } from '@/components/AgentSelector';
import useElevenLabs from "@/hooks/use-eleven-labs";
import MicrophonePermission from "@/components/MicrophonePermission";

const Index = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [selectedAgent, setSelectedAgent] = useState("agent_2401k467207hefr83sq8vsfkj5ys");
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    conversation,
    isStarted,
    isMuted,
    messages,
    startConversation,
    toggleMute,
  } = useElevenLabs(selectedAgent);

  const { status, isSpeaking } = conversation;

  // Hantera AI-processar timing
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role === 'user') {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(true);
      }, 100);
    }
    
    if (lastMessage.role === 'assistant') {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      setIsProcessing(false);
    }

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-poppins font-extrabold mb-6 text-primary">
            Tillsyns-assistenten
          </h1>
        </header>

        <MicrophonePermission permissionGranted={permissionGranted} />

        {permissionGranted !== false && (
          <main className="space-y-12">
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

            <div className="flex justify-center">
              <ConversationDisplay 
                messages={messages} 
                isProcessing={isProcessing}
              />
            </div>

            <div className="flex justify-center">
              <AgentSelector 
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
                disabled={isStarted}
              />
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default Index;
