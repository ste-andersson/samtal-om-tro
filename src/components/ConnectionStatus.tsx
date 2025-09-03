import { useState } from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const ConnectionStatus = () => {
  const [sttStatus, setSttStatus] = useState('disconnected');
  const [ttsStatus, setTtsStatus] = useState('disconnected');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default' as const;
      case 'connecting': return 'secondary' as const;
      case 'error': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Ansluten';
      case 'connecting': return 'Ansluter...';
      case 'error': return 'Fel';
      default: return 'Frånkopplad';
    }
  };

  const isConnected = sttStatus === 'connected' && ttsStatus === 'connected';
  const isConnecting = sttStatus === 'connecting' || ttsStatus === 'connecting';

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-card/50 rounded-lg border border-border/50">
      {/* STT och TTS badges - horisontellt */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center space-y-1">
          <Badge variant={getStatusVariant(sttStatus)} className="gap-1">
            {getStatusIcon(sttStatus)}
            STT
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getStatusText(sttStatus)}
          </span>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <Badge variant={getStatusVariant(ttsStatus)} className="gap-1">
            {getStatusIcon(ttsStatus)}
            TTS
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getStatusText(ttsStatus)}
          </span>
        </div>
      </div>

      {/* Anslut/Koppla från-knapp */}
      <div className="flex space-x-2">
        {!isConnected && !isConnecting ? (
          <Button 
            onClick={() => {/* connect logic */}} 
            size="sm" 
            variant="outline"
            className="gap-2 hover:bg-primary/10"
          >
            <Wifi className="w-4 h-4" />
            Anslut
          </Button>
        ) : (
          <Button 
            onClick={() => {/* disconnect logic */}} 
            size="sm" 
            variant="outline"
            className="gap-2 hover:bg-destructive/10"
          >
            <WifiOff className="w-4 h-4" />
            Koppla från
          </Button>
        )}
      </div>
    </div>
  );
};