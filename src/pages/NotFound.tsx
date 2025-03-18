
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-brand-dark font-maison">404</h1>
        <p className="text-xl text-brand-dark mb-6 font-maison">Hoppsan! Sidan hittades inte</p>
        <a href="/" className="text-brand-accent hover:text-brand-dark underline transition-colors font-maison">
          Återgå till Startsidan
        </a>
      </div>
    </div>
  );
};

export default NotFound;
