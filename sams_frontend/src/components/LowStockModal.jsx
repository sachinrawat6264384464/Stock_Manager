import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

const LowStockModal = ({ items, onClose }) => {
    const navigate = useNavigate();

    if (!items || items.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-b border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-full text-amber-600 dark:text-amber-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Low Stock Alert!</h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">The following items are running low and need restocking.</p>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{item.product__name}</h3>
                                <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    <span>{item.product__school}</span>
                                    <span className="bg-slate-200 dark:bg-slate-600 px-1.5 rounded text-slate-700 dark:text-slate-200 font-bold">{item.size}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-red-500 font-bold text-sm">{item.quantity} Left</span>
                                <button
                                    onClick={() => navigate('/stock-in', {
                                        state: {
                                            productId: item.id || null, // We might need to fetch IDs properly in backend View if helpful, currently using text matching or ID if available.
                                            // Wait, stats view returns 'product__name'. We need product ID for StockIn pre-fill. 
                                            // Let's rely on user selecting for now or improve backend later. 
                                            // Actually, let's just redirect to StockIn.
                                        }
                                    })}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Add Product
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold transition-colors"
                    >
                        Remind Me Later
                    </button>
                    {/* Add Product in footer not needed as per row action is better */}
                </div>
            </div>
        </div>
    );
};

export default LowStockModal;
