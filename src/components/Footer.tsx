import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-evenly gap-3 sm:gap-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-10 sm:h-12 w-auto bg-white rounded-md p-1"
            />
            <p className="text-xs sm:text-sm text-gray-400 text-center">
              © {currentYear} IMTS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
