
import React from 'react';
import { COLORS } from '../constants';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>{title}</h1>
      </div>
      <div>{rightAction}</div>
    </header>
  );
};
