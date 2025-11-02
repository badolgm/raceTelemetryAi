
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-4 md:p-6 transition-transform duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-teal-500/30 hover:border-teal-400/40 ${className}`}>
      {children}
    </div>
  );
};

export default Card;