
import React, { useState } from 'react';

// Icon components defined locally for simplicity
const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const DataTableIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const StoreIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const MegaphoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136a1.76 1.76 0 011.164-2.288l5.394-1.8zM19 13a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const BoxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

interface SidebarProps {
  currentView: 'dashboard' | 'data' | 'shopManagement' | 'adminManagement' | 'creatorHub' | 'creatorSamples' | 'affiliateService';
  setCurrentView: (view: 'dashboard' | 'data' | 'shopManagement' | 'adminManagement' | 'creatorHub' | 'creatorSamples' | 'affiliateService') => void;
  pendingEventsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, pendingEventsCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: ChartBarIcon },
    { id: 'adminManagement', label: 'Manajemen Admin', icon: UserIcon },
    { id: 'shopManagement', label: 'Manajemen Toko', icon: StoreIcon },
    { id: 'data', label: 'Data Omzet Toko', icon: DataTableIcon },
    { id: 'creatorHub', label: 'Hubungi Kreator', icon: MegaphoneIcon },
    { id: 'creatorSamples', label: 'Sampel Kreator', icon: BoxIcon },
    { id: 'affiliateService', label: 'Affiliate Service', icon: UsersIcon },
  ];
  
  const NavLinks = () => (
    <nav className="mt-10">
      {navItems.map(item => (
        <a
          key={item.id}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView(item.id as 'dashboard' | 'data' | 'shopManagement' | 'adminManagement' | 'creatorHub' | 'creatorSamples' | 'affiliateService');
            setIsMobileMenuOpen(false); // Close mobile menu on click
          }}
          className={`flex items-center px-4 py-3 my-2 text-gray-300 transition-colors duration-200 transform rounded-lg hover:bg-secondary hover:text-white ${currentView === item.id ? 'bg-secondary text-white' : ''}`}
        >
          <item.icon className="w-5 h-5" />
          <span className="mx-4 font-medium">{item.label}</span>
          {item.id === 'affiliateService' && pendingEventsCount > 0 && (
            <span className="ml-auto flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 w-5">
              {pendingEventsCount}
            </span>
          )}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-primary rounded-md text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside className={`flex-shrink-0 w-64 bg-primary flex-col fixed inset-y-0 left-0 z-10 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-center px-4 h-16">
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <NavLinks />
        </div>
      </aside>
       {/* Overlay for mobile */}
       {isMobileMenuOpen && <div className="fixed inset-0 bg-black opacity-50 z-0 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </>
  );
};

export default Sidebar;
