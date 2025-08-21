import React from 'react';

/**
 * Loading Spinner Component
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant (small, medium, large)
 * @param {string} props.text - Loading text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullScreen - Show full screen loading
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  className = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`${sizeClasses[size]} loading-spinner mb-4`}></div>
      {text && (
        <p className={`text-gray-600 ${textSizes[size]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
