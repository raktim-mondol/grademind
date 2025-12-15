import React from 'react';

export const Input = ({ label, error, hint, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-black mb-1.5">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm
          placeholder-zinc-400 text-black
          transition-all duration-200 ease-out
          focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
          hover:border-zinc-300
          disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
                {...props}
            />
            {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export const TextArea = ({ label, error, hint, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-black mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                className={`
          w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-sm
          placeholder-zinc-400 text-black
          transition-all duration-200 ease-out
          focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
          hover:border-zinc-300
          disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
                {...props}
            />
            {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export const Select = ({ label, error, hint, options = [], className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-black mb-1.5">
                    {label}
                </label>
            )}
            <select
                className={`
          w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm
          text-black
          transition-all duration-200 ease-out
          focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
          hover:border-zinc-300
          disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
};

// Checkbox component
export const Checkbox = ({ label, checked, onChange, className = '', ...props }) => {
    return (
        <label className={`inline-flex items-center cursor-pointer ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only"
                {...props}
            />
            <span
                className={`
          w-5 h-5 rounded border-2 flex items-center justify-center
          transition-all duration-200 ease-out
          ${checked
                        ? 'bg-black border-black'
                        : 'bg-white border-zinc-300 hover:border-zinc-400'}
        `}
            >
                {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </span>
            {label && <span className="ml-2 text-sm text-black">{label}</span>}
        </label>
    );
};

// Toggle/Switch component
export const Toggle = ({ label, checked, onChange, className = '', ...props }) => {
    return (
        <label className={`inline-flex items-center cursor-pointer ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only"
                {...props}
            />
            <span
                className={`
          relative w-11 h-6 rounded-full
          transition-all duration-200 ease-out
          ${checked ? 'bg-black' : 'bg-zinc-200'}
        `}
            >
                <span
                    className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform duration-200 ease-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
                />
            </span>
            {label && <span className="ml-3 text-sm text-black">{label}</span>}
        </label>
    );
};
