import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800 shadow-sm hover:shadow-md active:shadow-sm',
    secondary: 'bg-white text-black border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-black',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
    outline: 'bg-transparent text-black border border-black hover:bg-black hover:text-white',
};

const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled,
    icon: Icon,
    iconPosition = 'left',
    ...props
}) => {
    return (
        <button
            className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        transform hover:-translate-y-0.5 active:translate-y-0
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
            {children}
            {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
        </button>
    );
};

// Icon-only button variant
export const IconButton = ({
    icon: Icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}) => {
    const iconSizes = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const iconInnerSizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center rounded-lg
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${iconSizes[size]}
        ${className}
      `}
            {...props}
        >
            <Icon className={iconInnerSizes[size]} />
        </button>
    );
};
