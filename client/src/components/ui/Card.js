import React from 'react';

export const Card = ({ children, className = '', noPadding = false, hover = true, ...props }) => {
    return (
        <div
            className={`
        bg-white rounded-xl border border-zinc-200 
        ${hover ? 'shadow-sm hover:shadow-lg hover:border-zinc-300 transition-all duration-300 ease-out' : 'shadow-sm'}
        overflow-hidden
        ${className}
      `}
            {...props}
        >
            <div className={noPadding ? '' : 'p-5'}>
                {children}
            </div>
        </div>
    );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <div>
                {title && <h3 className="text-lg font-semibold text-black">{title}</h3>}
                {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

// Interactive card for selection states
export const SelectableCard = ({
    children,
    selected = false,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`
        cursor-pointer rounded-xl border-2 p-5
        transition-all duration-300 ease-out
        ${selected
                    ? 'bg-black text-white border-black shadow-xl scale-[1.02]'
                    : 'bg-white text-black border-zinc-200 hover:border-zinc-400 hover:shadow-md'}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

// Stats card variant
export const StatsCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className = ''
}) => {
    return (
        <div className={`bg-white rounded-xl border border-zinc-200 p-5 shadow-sm ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <p className="text-2xl font-bold text-black mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-black" />
                    </div>
                )}
            </div>
            {trend && (
                <div className={`mt-3 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
                </div>
            )}
        </div>
    );
};
