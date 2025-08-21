import React from 'react';

/**
 * Card Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.padding - Enable padding
 */
const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = true,
  ...props 
}) => {
  const cardClasses = `
    ${hover ? 'card-hover' : 'card'}
    ${!padding ? '!p-0' : ''}
    ${className}
  `.trim();

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
