import { useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sttStatus, setSttStatus] = useState('disconnected'); // connected/connecting/error/disconnected

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
  };

  const isConnected = sttStatus === 'connected';
  const isConnecting = sttStatus === 'connecting';

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleRecordToggle}
        disabled={!isConnected || isConnecting}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-recording hover:bg-recording/90 animate-pulse-recording shadow-lg' 
            : 'bg-primary hover:bg-primary/90 hover:scale-105 shadow-md hover:shadow-lg'
        }`}
      >
        {isRecording ? (
          <PhoneOff className="w-8 h-8" />
        ) : (
          <Phone className="w-8 h-8" />
        )}
        
        {/* Animerad ring vid inspelning */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-recording/20 animate-ping" />
        )}
      </Button>
      
      {/* Statustext under knappen */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Status: {
            sttStatus === 'connected' ? 'Ansluten' :
            sttStatus === 'connecting' ? 'Ansluter...' :
            sttStatus === 'error' ? 'Fel' : 'Frånkopplad'
          }
        </p>
      </div>
    </div>
  );
};