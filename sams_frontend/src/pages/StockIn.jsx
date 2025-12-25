import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

import { Save, AlertCircle } from 'lucide-react';

const StockIn = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState('');
    const [supplier, setSupplier] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('products/');
                setProducts(res.data);

                // Pre-fill from location state if available
                if (location.state?.productId) {
                    setSelectedProduct(location.state.productId);
                }
                // We delay setting size slightly or just set it, but we need products loaded
                // Actually, if we set selectedProduct, the render logic for 'sizes' will work.
                // We might need a second effect or just set it here knowing render will catch up.
                if (location.state?.sizeId) {
                    setSelectedSize(location.state.sizeId);
                }

            } catch (error) {
                console.error("Error fetching products", error);
            }
        };
        fetchProducts();
    }, []);

    // Effect to handle size pre-selection after products load if needed, but simple state setting above usually works
    // if the select 'value' is controlled.
    // However, if sizes are derived from selectedProduct below, we need to ensure selectedProduct is set first.
    // The above sequential setStates in async function will work fine.


    const product = products.find(p => p.id === parseInt(selectedProduct));
    const sizes = product ? product.sizes : [];

    // Ensure size is selected only if it exists in the selected product's sizes
    useEffect(() => {
        if (location.state?.sizeId && sizes.length > 0) {
            const sizeExists = sizes.find(s => s.size === location.state.sizeName); // Optional check
            // Simple ID match is enough if we trust the ID
            setSelectedSize(location.state.sizeId);
        }
    }, [products, selectedProduct]);
    // Wait, the previous logic was fine, but adding this ensures it syncs if products load late.
    // Actually, simplifying: The component renders. 'product' is derived. 'sizes' is derived. 
    // If selectedProduct is set, 'sizes' will define. Then 'selectedSize' (state) will be applied to the select value.
    // So no extra effect is strictly needed if IDs match.
    // Let's just keep the derivation.


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('stock/in/', {
                product_size: selectedSize,
                quantity: parseInt(quantity),
                supplier
            });
            setMessage({ type: 'success', text: 'Stock updated successfully!' });
            setQuantity('');
            setSupplier('');
            setSelectedProduct('');
            setSelectedSize('');
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update stock. Try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Save className="text-blue-600 dark:text-orange-500" /> Stock In Entry
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors duration-300">
                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <AlertCircle size={20} />
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-200 mb-2">Select Product</label>
                        <select
                            className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 outline-none transition-all"
                            value={selectedProduct}
                            onChange={(e) => {
                                setSelectedProduct(e.target.value);
                                setSelectedSize('');
                            }}
                            required
                        >
                            <option value="" className="dark:bg-slate-800">-- Choose Product --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.name} - {p.school}</option>
                            ))}
                        </select>
                    </div>

                    {selectedProduct && (
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-2">Select Size</label>
                            <select
                                className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 outline-none transition-all"
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                required
                            >
                                <option value="" className="dark:bg-slate-800">-- Choose Size --</option>
                                {sizes.map(s => (
                                    <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.size} (Current Qty: {s.quantity})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-2">Quantity to Add</label>
                            <input
                                type="number"
                                className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 outline-none transition-all"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-200 mb-2">Supplier (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 outline-none transition-all"
                                placeholder="Supplier Name"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-blue-900/20 active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 dark:bg-orange-600 hover:bg-blue-700 dark:hover:bg-orange-700'}`}
                    >
                        {loading ? 'Updating...' : 'Confirm Stock In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StockIn;
