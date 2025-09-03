import { NavLink } from 'react-router-dom';
import { FileText, CheckSquare, MessageCircle, Folder, Menu } from 'lucide-react';
import { useCase } from '@/contexts/CaseContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export const Navigation = () => {
  const { selectedCase } = useCase();
  const [isOpen, setIsOpen] = useState(false);
  
  const navigationItems = [
    { title: 'Ärenden', path: '/cases', icon: FileText },
    { title: 'Checklista/brister', path: '/checklist', icon: CheckSquare },
    { title: 'Tillsynsassistenten', path: '/', icon: MessageCircle },
    { title: 'Filer', path: '/files', icon: Folder },
  ];

  const NavigationItems = ({ mobile = false }) => (
    <>
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => mobile && setIsOpen(false)}
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mobile ? 'w-full justify-start' : ''
            } ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`
          }
        >
          <item.icon className="w-4 h-4" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 flex-1">
            <NavigationItems />
          </div>
          
          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-2 flex-1">
            <NavigationItems />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex-1">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-accent">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavigationItems mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Selected Case Display */}
          {selectedCase && (
            <div className="flex items-center bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 min-w-0 max-w-xs md:max-w-sm lg:max-w-md ml-auto">
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-xs font-medium text-primary/80 hidden sm:block mb-0.5">
                  Valt ärende
                </span>
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm font-semibold text-primary truncate flex-1">
                    {selectedCase.name}
                  </span>
                  <span className="text-xs text-primary/70 whitespace-nowrap font-medium">
                    {selectedCase.caseNumber}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};