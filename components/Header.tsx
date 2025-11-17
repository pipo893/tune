
import React from 'react';

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.5M4 6.253V18.75c0 .621.504 1.125 1.125 1.125h13.75c.621 0 1.125-.504 1.125-1.125V6.253M4 6.253h16" />
    </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        <BookOpenIcon />
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          LingoSphere AI
        </h1>
      </div>
    </header>
  );
};

export default Header;
