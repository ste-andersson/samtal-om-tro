
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
      <Card className="w-full h-60 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
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
    <Card className="w-full h-60 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Live Transcription</CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto h-48 space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet. Start a conversation to see the transcription.</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`${message.role === "assistant" ? "pl-4 border-l-2 border-blue-400" : "font-medium"}`}>
              <span className={`${message.role === "assistant" ? "text-blue-600" : "text-green-600"} font-semibold`}>
                {message.role === "assistant" ? "Assistant: " : "You: "}
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
