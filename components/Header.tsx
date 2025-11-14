
import React from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface HeaderProps {
  user: User;
}

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="flex-shrink-0 bg-white shadow-md">
      <div className="flex items-center justify-between p-4 h-16">
        <div className="flex items-center">
            {/* Can add a welcome message or page title here */}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 hidden md:block">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            aria-label="Logout"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
