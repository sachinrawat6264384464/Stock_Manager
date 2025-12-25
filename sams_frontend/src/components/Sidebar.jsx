import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shirt, PlusCircle, Receipt, Activity, BarChart2 } from 'lucide-react';

const Sidebar = ({ onClose }) => {
    const location = useLocation();

    const links = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/products', label: 'Products & Sizes', icon: Shirt },
        { path: '/stock-in', label: 'Stock In', icon: PlusCircle },
        { path: '/billing', label: 'Billing', icon: Receipt },
        { path: '/activities', label: 'History', icon: Activity },
        { path: '/analytics', label: 'Visualization', icon: BarChart2 },
    ];

    return (
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white h-screen overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-orange-500 dark:to-red-500 bg-clip-text text-transparent transition-all duration-300">
                    SAMS
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Stock & Billing Manager</p>
            </div>

            <nav className="mt-6 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-blue-600 dark:bg-orange-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-orange-500/30 font-semibold scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-orange-500'} transition-colors`} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
