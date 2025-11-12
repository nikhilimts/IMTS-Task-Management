import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="h-20 w-auto mr-4"
            />
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
