
import ElevenLabsChat from "@/components/ElevenLabsChat";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-hantverksdata-light-grey font-sans">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-hantverksdata-blue">Hantverksdata</h1>
        </div>
      </header>
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-hantverksdata-grey">Röstassistent</h2>
          <p className="text-lg text-hantverksdata-grey">
            Klicka på knappen nedan för att starta en konversation med vår AI-röstassistent. Din konversation kommer att transkriberas i realtid.
          </p>
        </div>
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <ElevenLabsChat />
        </div>
      </div>
      
      <footer className="bg-hantverksdata-blue text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Hantverksdata</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
