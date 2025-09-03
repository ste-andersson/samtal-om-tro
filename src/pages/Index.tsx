import { useState, useEffect } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const Index = () => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        {/* Header med exakt denna titel */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-poppins font-extrabold mb-6 text-primary">
            Tillsyns-assistenten
          </h1>
        </header>

        {/* Main Content - exakt denna layout */}
        <main className="space-y-12">
          {/* Controls Section - ConnectionStatus TILL VÄNSTER, AudioRecorder TILL HÖGER */}
          <div className="flex justify-center items-center gap-8">
            <ConnectionStatus />
            <AudioRecorder />
          </div>

          {/* Conversation Display - centrerat under */}
          <div className="flex justify-center">
            <ConversationDisplay 
              messages={messages} 
              isProcessing={isProcessing} 
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;