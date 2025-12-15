import React, { useState } from 'react';
import { Menu, X, Home, Settings, LogOut, Check } from 'lucide-react';
import { useUser } from '../../auth/ClerkWrapper';

export const AppLayout = ({ children, activeView, onViewChange, onLogout, overlay }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useUser();

    const navItems = [
        { id: 'WORKSPACES', label: 'Workspaces', icon: Home },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 
        transform transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white border-2 border-black rounded-sm flex items-center justify-center">
                                <Check className="w-4 h-4 text-black" strokeWidth={3} />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-black">GradeMind.ai</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onViewChange(item.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`
                    w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
                    transition-all duration-200 ease-out group
                    ${isActive
                                            ? 'bg-black text-white shadow-sm'
                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}
                  `}
                                >
                                    <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-zinc-100">
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=000000&color=fff`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full bg-zinc-200 ring-2 ring-zinc-100"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate">
                                    {user?.fullName || 'User'}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                    {user?.primaryEmailAddress?.emailAddress || 'user@example.com'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onViewChange('SETTINGS');
                                    setIsSidebarOpen(false);
                                }}
                                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black transition-all duration-200"
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 hover:text-black transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b border-zinc-200 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white border-2 border-black rounded-sm flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" strokeWidth={3} />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-black">GradeMind.ai</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-black transition-all duration-200"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
                    <div className="max-w-6xl mx-auto animate-in">
                        {children}
                    </div>
                </main>

                {/* Overlay */}
                {overlay}
            </div>
        </div>
    );
};
