
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  role: string;
  content: string;
}

interface TranscriptionDisplayProps {
  messages: Message[];
  isLoading?: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  messages, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card className="w-full h-60 overflow-hidden border-brand-dark/20">
        <CardHeader className="pb-2 bg-brand-light/50">
          <CardTitle className="text-lg font-maison">
            <Skeleton className="h-6 w-1/2" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-60 overflow-hidden border-brand-dark/20">
      <CardHeader className="pb-2 bg-brand-light/50">
        <CardTitle className="text-lg font-maison text-brand-dark">Livetranskription</CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto h-48 space-y-2 font-maison">
        {messages.length === 0 ? (
          <p className="text-brand-dark/70 italic">Inga meddelanden än. Starta en konversation för att se transkriptionen.</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`${message.role === "assistant" ? "pl-4 border-l-2 border-brand-accent" : "font-medium"}`}>
              <span className={`${message.role === "assistant" ? "text-brand-dark" : "text-brand-accent"} font-semibold`}>
                {message.role === "assistant" ? "Assistent: " : "Du: "}
              </span>
              {message.content}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptionDisplay;
