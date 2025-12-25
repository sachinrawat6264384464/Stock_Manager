import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Sun, Moon } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Theme State
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    // Apply Theme Effect
    useEffect(() => {
        const root = window.document.documentElement;
        const body = window.document.body;
        if (theme === 'dark') {
            root.classList.add('dark');
            body.classList.add('dark'); // Add to body for extra safety
        } else {
            root.classList.remove('dark');
            body.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-300 lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full lg:w-auto min-h-screen transition-all duration-300 flex flex-col">
                <header className="bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-8 h-16 sticky top-0 z-10 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Stock Manager</h2>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-yellow-400 border border-transparent dark:border-slate-700"
                        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === 'dark' ? <Sun size={24} className="fill-yellow-400 text-yellow-400" /> : <Moon size={24} className="fill-slate-600 text-slate-600" />}
                    </button>
                </header>
                <main className="p-4 lg:p-8 overflow-x-hidden text-slate-900 dark:text-slate-100">
                    <Outlet context={{ theme }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
