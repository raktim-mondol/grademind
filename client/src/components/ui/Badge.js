import React from 'react';

const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-light text-primary',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]}
      ${className}
    `}>
            {children}
        </span>
    );
};
