
import ElevenLabsChat from "@/components/ElevenLabsChat";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Röstassistent</h1>
        <p className="text-xl text-gray-600">
          Klicka på knappen nedan för att starta en konversation med vår AI-röstassistent. Din konversation kommer att transkriberas i realtid.
        </p>
      </div>
      <div className="w-full max-w-2xl mx-auto">
        <ElevenLabsChat />
      </div>
    </div>
  );
};

export default Index;
