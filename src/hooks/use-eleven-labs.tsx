import { useConversation } from "@11labs/react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: string;
  content: string;
};

export const useElevenLabs = (agentId: string = "agent_2401k467207hefr83sq8vsfkj5ys") => {
  const { toast } = useToast();
  const [isStarted, setIsStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Array<Message>>([]);

  const conversation = useConversation({
    onConnect: () => {
      toast({
        title: "Ansluten till AI-assistenten",
        description: "Du kan nu starta en konversation",
      });
    },
    onDisconnect: () => {
      setIsStarted(false);
      toast({
        title: "Frånkopplad från AI-assistenten",
        description: "Konversationen har avslutats",
      });
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Det uppstod ett fel vid anslutning till assistenten",
      });
      setIsStarted(false);
    },
    onMessage: (message) => {
      if (message.type === "llm_response" || message.type === "voice_response") {
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

  const startConversation = async () => {
    try {
      if (conversation.status === "connected") {
        await conversation.endSession();
        setIsStarted(false);
        return;
      }

      setMessages([]);
      
      await conversation.startSession({ 
        agentId: agentId 
      });
      
      setIsStarted(true);
    } catch (error) {
      console.error("Error starting/ending conversation:", error);
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Kunde inte starta/avsluta konversationen. Försök igen.",
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

  return {
    conversation,
    isStarted,
    isMuted,
    messages,
    startConversation,
    toggleMute,
  };
};

export default useElevenLabs;
