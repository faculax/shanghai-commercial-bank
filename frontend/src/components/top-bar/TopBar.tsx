import React, { useState, useRef, useEffect } from 'react';

export const TopBar: React.FC = () => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen(!isAdminMenuOpen);
  };

  return (
    <nav className="bg-fd-darker border-b border-fd-border py-3 px-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-fd-green rounded-full"></div>
          <span className="text-fd-green font-medium">SYSTEM ONLINE</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleAdminMenu}
            className="btn btn-outline flex items-center"
          >
            <span>Admin</span>
            <svg 
              className={`ml-2 w-4 h-4 transition-transform duration-200 ${isAdminMenuOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {isAdminMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 py-2 bg-fd-darker rounded-md shadow-fd border border-fd-border z-10">
              <div className="px-4 py-3 text-center text-fd-text-muted text-sm">
                No admin actions available
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopBar;