import React, { useState } from 'react';
import { Menu, ChevronDown, MapPin } from 'lucide-react';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  selectedLake: string;
  setSelectedLake: (value: string) => void;
  lakes: string[];
  navigationItems: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }[];
  activePage: string;
  setActivePage: (value: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  selectedLake,
  setSelectedLake,
  lakes,
  navigationItems,
  activePage,
  setActivePage
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="self-center text-2xl font-semibold whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Glofsense
              </span>
            </div>
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                {selectedLake}
                <ChevronDown className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <div 
                className={`${
                  isDropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                } origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 transition-all duration-200`}
              >
                <div className="py-1">
                  {lakes.map((lake) => (
                    <button
                      key={lake}
                      onClick={() => {
                        setSelectedLake(lake);
                        setIsDropdownOpen(false);
                      }}
                      className="group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <MapPin className={`w-4 h-4 mr-2 transition-colors ${
                        selectedLake === lake ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
                      }`} />
                      {lake}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 sm:translate-x-0`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-2 font-medium">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center w-full p-3 text-gray-900 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 ${
                    activePage === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : ''
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Navbar;