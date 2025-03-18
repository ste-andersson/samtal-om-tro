
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-hantverksdata-light-grey font-sans">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-hantverksdata-blue">Hantverksdata</h1>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-5xl font-bold text-hantverksdata-blue mb-4">404</h2>
          <p className="text-xl text-hantverksdata-grey mb-6">Hoppsan! Sidan hittades inte</p>
          <Button asChild className="bg-hantverksdata-blue hover:bg-hantverksdata-light-blue">
            <a href="/">Återgå till Startsidan</a>
          </Button>
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

export default NotFound;
