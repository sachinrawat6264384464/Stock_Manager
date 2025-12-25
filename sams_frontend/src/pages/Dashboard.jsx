import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Package, TrendingUp, AlertTriangle, Activity, Plus, Save, X, FileText } from 'lucide-react';

import InvoiceModal from '../components/InvoiceModal';
import LowStockModal from '../components/LowStockModal';
import BillingInterface from '../components/BillingInterface';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showLowStock, setShowLowStock] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [showAddBillModal, setShowAddBillModal] = useState(false);

    // Inline Stock In State
    const [refillQty, setRefillQty] = useState({});

    const fetchStats = async () => {
        try {
            const response = await api.get('dashboard/stats/');
            setStats(response.data);
            if (response.data.low_stock_items && response.data.low_stock_items.length > 0) {
                // Only show popup once per session or just let it show on load.
                // For now, let's show it if it's the initial load.
                // We can check if we already showed it to avoid re-popup on manual refresh, but simple is ok.
            }
            // Logic for popup: If we just loaded and have low stock, show it.
            // But we don't want it popping up every time we refill one item.
            // So let's control it: default false, set true only on initial load if items > 0.
            // Actually, I'll set it in the useEffect only.
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchStats();
            // Check stats after fetch - wait, fetchStats is async and sets state. 
            // Better to do logic inside fetch or separate effect.
            // Let's modify fetchStats to return data or set showLowStock there.
        };
        init();
    }, []);

    // Effect to show modal once on load
    useEffect(() => {
        if (stats?.low_stock_items?.length > 0 && !sessionStorage.getItem('lowStockViewed')) {
            setShowLowStock(true);
            sessionStorage.setItem('lowStockViewed', 'true');
        }
    }, [stats]);


    const handleQuickStockIn = async (item, index) => {
        const qty = refillQty[index];
        if (!qty || parseInt(qty) <= 0) return;

        const payload = {
            product_size: item.id, // Using item.id directly as it should be ProductSize ID
            quantity: parseInt(qty),
            supplier: 'Quick Refill (Dashboard)'
        };

        // DEBUG: Check if we have the ID
        if (!item.id) {
            alert("Error: Missing Product Size ID. Please refresh the page.");
            return;
        }

        try {
            await api.post('stock/in/', payload);

            // Clear input
            setRefillQty({ ...refillQty, [index]: '' });

            // Refresh stats to remove item from list
            fetchStats();

        } catch (error) {
            console.error("Refill error:", error);
            alert('Refill failed: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) return <div className="flex justify-center p-20">Loading...</div>;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {/* Total Stock Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-orange-500 dark:to-orange-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 dark:shadow-orange-500/20 text-white flex items-center gap-4 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Package size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-blue-100 dark:text-orange-100 font-medium">Total Stock</p>
                        <h3 className="text-3xl font-bold">{stats?.total_stock || 0}</h3>
                    </div>
                </div>

                {/* Today's Sales Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex items-center gap-4 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <TrendingUp size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-emerald-100 font-medium">Today's Sales</p>
                        <h3 className="text-2xl font-bold">₹{stats?.today_sales || 0}</h3>
                    </div>
                </div>

                {/* Total Products Card */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-purple-500/20 text-white flex items-center gap-4 transform transition-all hover:scale-105 duration-300">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Package size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-purple-100 font-medium">Total Products</p>
                        <h3 className="text-3xl font-bold">{stats?.total_products || 0}</h3>
                    </div>
                </div>

                {/* Quick Bill Card */}
                <div
                    onClick={() => setShowBillingModal(true)}
                    className="bg-gradient-to-br from-pink-500 to-rose-600 cursor-pointer p-6 rounded-2xl shadow-lg shadow-pink-500/20 text-white flex items-center gap-4 transform transition-all hover:scale-105 duration-300"
                >
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <FileText size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-pink-100 font-medium">Quick Bill</p>
                        <h3 className="text-xl font-bold">Create New</h3>
                    </div>
                </div>

                {/* Add Bill Form Card */}
                <div
                    onClick={() => setShowAddBillModal(true)}
                    className="bg-gradient-to-br from-teal-500 to-cyan-600 cursor-pointer p-6 rounded-2xl shadow-lg shadow-teal-500/20 text-white flex items-center gap-4 transform transition-all hover:scale-105 duration-300"
                >
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Plus size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-teal-100 font-medium">Add Bill</p>
                        <h3 className="text-xl font-bold">Form Only</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Low Stock Alert */}
                <div className="h-[calc(70vh-180px)] overflow-y-auto pr-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-white">Low Stock Alerts</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm">
                                    <tr>
                                        <th className="p-4 font-medium">Product</th>
                                        <th className="p-4 font-medium">Size</th>
                                        <th className="p-4 font-medium text-right">Qty</th>
                                        <th className="p-4 font-medium w-40">Quick Refill</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {stats?.low_stock_items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 text-slate-700 dark:text-slate-200 font-medium">
                                                {item.product__name}
                                                <span className="text-xs text-slate-400 block">{item.product__school}</span>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">
                                                    {item.size}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-red-600 font-bold">{item.quantity}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 p-2 border border-slate-200 rounded text-center text-sm"
                                                        placeholder="Qty"
                                                        value={refillQty[index] || ''}
                                                        onChange={(e) => setRefillQty({ ...refillQty, [index]: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => handleQuickStockIn(item, index)}
                                                        disabled={!refillQty[index]}
                                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Add Stock"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.low_stock_items || stats.low_stock_items.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-400">All stocks are healthy!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Billing History */}
                <div className="h-[calc(85vh-180px)] overflow-y-auto pr-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-2">
                            <Activity className="text-blue-500 dark:text-orange-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-white">Customer History (Recent Bills)</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {stats?.recent_bills?.map((bill) => (
                                <div
                                    key={bill.id}
                                    onClick={() => setSelectedBill(bill)}
                                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{bill.customer_name || 'Guest'}</p>
                                        <p className="text-xs text-slate-400 mt-1">{bill.bill_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">₹{bill.total_amount}</p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(bill.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recent_bills || stats.recent_bills.length === 0) && (
                                <div className="p-8 text-center text-slate-400 italic">No recent bills found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <InvoiceModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
            {showLowStock && (
                <LowStockModal
                    items={stats?.low_stock_items}
                    onClose={() => setShowLowStock(false)}
                />
            )}

            {/* Quick Billing Modal */}
            {showBillingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowBillingModal(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <div className="p-6 h-full overflow-y-auto">
                            <BillingInterface isModal={true} onClose={() => setShowBillingModal(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Add Bill Form Modal - formOnly mode */}
            {showAddBillModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowAddBillModal(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <div className="p-6 h-full overflow-y-auto">
                            <BillingInterface isModal={true} formOnly={true} onClose={() => setShowAddBillModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
