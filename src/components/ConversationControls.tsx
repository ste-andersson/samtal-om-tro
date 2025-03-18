
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ConversationControlsProps {
  status: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isStarted: boolean;
  permissionGranted: boolean | null;
  onStart: () => Promise<void>;
  onToggleMute: () => Promise<void>;
}

const ConversationControls: FC<ConversationControlsProps> = ({
  status,
  isSpeaking,
  isMuted,
  permissionGranted,
  onStart,
  onToggleMute
}) => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-white rounded-lg shadow-md w-full">
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-bold">Röstassistent</h2>
        {status === "connected" && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onToggleMute}
            aria-label={isMuted ? "Slå på ljud" : "Stäng av ljud"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        )}
      </div>
      
      <div className={`w-full h-24 rounded-lg flex items-center justify-center transition-colors ${isSpeaking ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
        {isSpeaking ? (
          <div className="flex items-center space-x-2">
            <span className="animate-pulse text-blue-600">Assistenten pratar...</span>
          </div>
        ) : status === "connected" ? (
          <p className="text-gray-600">Lyssnar efter din röst...</p>
        ) : (
          <p className="text-gray-500">Tryck på knappen nedan för att starta</p>
        )}
      </div>

      <Button 
        className="w-full"
        onClick={onStart}
        disabled={permissionGranted === null}
        variant={status === "connected" ? "destructive" : "default"}
      >
        {status === "connected" ? (
          <>
            <MicOff className="mr-2 h-5 w-5" /> Avsluta konversation
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" /> Starta konversation
          </>
        )}
      </Button>
    </div>
  );
};

export default ConversationControls;
