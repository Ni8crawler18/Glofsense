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
  riskLevel: "low" | "medium" | "high"; // ✅ Added riskLevel as a required prop
}

const Navbar: React.FC<NavbarProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  selectedLake,
  setSelectedLake,
  lakes,
  navigationItems,
  activePage,
  setActivePage,
  riskLevel, // ✅ Now included in the component props
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 py-4 lg:px-6 flex items-center justify-between relative">
          {/* Left Section (Logo & Menu) */}
          <div className="flex items-center">
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
          {/* Centered & Animated Risk Level Badge */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md 
                transition-all duration-300 ease-in-out animate-floating
                ${riskLevel === "low" ? "bg-green-100 text-green-600" :
                  riskLevel === "medium" ? "bg-yellow-100 text-yellow-600" :
                  "bg-red-100 text-red-600 animate-pulse-custom"}`} // Custom pulse for high risk
            >
              <span className="text-lg font-semibold">⚠️ GLOF Occurence Chance:</span>
              <span className="font-bold capitalize">{riskLevel}</span>
            </div>
          </div>

          {/* Custom Animations */}
          <style>
          {`
            @keyframes floating {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            .animate-floating {
              animation: floating 3s ease-in-out infinite;
            }

            @keyframes pulse-custom {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            .animate-pulse-custom {
              animation: pulse-custom 2s ease-in-out infinite;
            }
          `}
          </style>

          {/* Right Section (Lake Selector) */}
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

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                <ul className="py-2 text-gray-700">
                  {lakes.map((lake) => (
                    <li key={lake}>
                      <button
                        onClick={() => {
                          setSelectedLake(lake);
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                      >
                        {lake}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Navigation */}
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
