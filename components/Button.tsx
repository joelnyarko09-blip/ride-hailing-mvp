
import React from 'react';
import { COLORS } from '../constants';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  icon
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: `bg-[${COLORS.primary}] text-white shadow-lg hover:brightness-110`,
    secondary: `bg-[${COLORS.secondary}] text-white hover:brightness-110`,
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-100",
    danger: `bg-[${COLORS.error}] text-white hover:brightness-110`,
  };

  // Inline style for dynamic colors that Tailwind JIT might miss if not in string literals
  const customBg = variant === 'primary' ? { backgroundColor: COLORS.primary } : variant === 'secondary' ? { backgroundColor: COLORS.secondary } : {};

  return (
    <button 
      style={customBg}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
};
