
import React from 'react';
import type { ReactNode } from 'react';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  disabled = false,
  variant = 'primary',
}) => {
  const baseStyles = 'flex items-center justify-center px-6 py-3 font-semibold rounded-lg focus:outline-none focus:ring-4 transition-all duration-300 transform hover:scale-105';
  
  const variantStyles = {
    primary: `text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`,
    secondary: `text-gray-200 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;
