import { useState, useEffect } from 'react';
import api from '../api/axios';

import { Plus, ChevronDown, ChevronUp, PlusCircle, Trash2, Search, Filter } from 'lucide-react';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [selectedProductForSize, setSelectedProductForSize] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Form States
    const [newProduct, setNewProduct] = useState({ name: '', school: '', category: 'Blazer', price: '', size: '', quantity: '', low_stock_threshold: 5 });
    const [newSize, setNewSize] = useState({ size: '', quantity: 0, low_stock_threshold: 5 });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('products/');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Derived lists for autocomplete
    const uniqueSchools = [...new Set(products.map(p => p.school))];
    const sizeOptions = [
        'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', // Letter Sizes
        ...Array.from({ length: 14 }, (_, i) => String(20 + i * 2)) // Number Sizes: 20, 22, ... 46
    ];

    // Filtered products
    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.school.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleDeleteProduct = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`products/${id}/`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Failed to delete product');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Product
            const productRes = await api.post('products/', {
                name: newProduct.name,
                school: newProduct.school,
                category: newProduct.category,
                price: newProduct.price
            });

            // 2. Add Size if provided
            if (newProduct.size && productRes.data.id) {
                await api.post(`products/${productRes.data.id}/add_size/`, {
                    size: newProduct.size,
                    quantity: newProduct.quantity || 0,
                    low_stock_threshold: newProduct.low_stock_threshold || 5
                });
            }

            setShowAddModal(false);
            setNewProduct({ name: '', school: '', category: 'Blazer', price: '', size: '', quantity: '', low_stock_threshold: 5 });
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Error adding product. Please check inputs.');
        }
    };

    const handleAddSize = async (e) => {
        e.preventDefault();
        if (!selectedProductForSize) return;
        try {
            await api.post(`products/${selectedProductForSize.id}/add_size/`, newSize);
            setShowSizeModal(false);
            setNewSize({ size: '', quantity: 0, low_stock_threshold: 5 });
            fetchProducts();
        } catch (error) {
            alert('Error adding size');
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Product Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 dark:bg-orange-600 hover:bg-blue-700 dark:hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 transition-colors duration-300">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by product name or school..."
                        className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 bg-white dark:bg-slate-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48 relative">
                    <Filter className="absolute left-3 top-3 text-slate-400" size={20} />
                    <select
                        className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 appearance-none bg-white dark:bg-slate-700 dark:text-white"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        <option value="Blazer">Blazer</option>
                        <option value="Shirt">Shirt</option>
                        <option value="Pant">Pant</option>
                        <option value="Skirt">Skirt</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="h-[calc(98vh-280px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 font-bold">
                                            {product.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{product.name}</h3>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 flex gap-2">
                                                <span>{product.school}</span> • <span>{product.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">₹{product.price}</span>
                                        <button
                                            onClick={(e) => handleDeleteProduct(e, product.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                                            title="Delete Product"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {expandedProduct === product.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                    </div>
                                </div>

                                {expandedProduct === product.id && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Available Sizes</h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProductForSize(product);
                                                    setShowSizeModal(true);
                                                }}
                                                className="text-blue-600 dark:text-orange-500 hover:bg-blue-100 dark:hover:bg-orange-500/10 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 transition-colors"
                                            >
                                                <PlusCircle size={16} /> Add Size
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {product.sizes.map((size) => (
                                                <div key={size.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-center shadow-sm">
                                                    <div className="font-bold text-slate-800 dark:text-white text-lg">{size.size}</div>
                                                    <div className={`text-xs font-bold mt-1 ${size.quantity <= (size.low_stock_threshold || 5) ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                                        Qty: {size.quantity}
                                                    </div>
                                                    {size.quantity <= (size.low_stock_threshold || 5) && (
                                                        <div className="text-[10px] text-red-500 font-bold uppercase mt-1">Low Stock</div>
                                                    )}
                                                </div>
                                            ))}
                                            {product.sizes.length === 0 && (
                                                <div className="col-span-full text-center py-4 text-slate-400 italic">No sizes added yet.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                            <p className="text-slate-400 text-lg italic">No products found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Add New Product</h3>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <input
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Product Name (e.g. Blazer)"
                                value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required
                            />
                            <input
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="School Name" list="school-suggestions"
                                value={newProduct.school} onChange={e => setNewProduct({ ...newProduct, school: e.target.value })} required
                            />
                            <datalist id="school-suggestions">
                                {uniqueSchools.map(school => <option key={school} value={school} />)}
                            </datalist>

                            <select
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                            >
                                <option value="Blazer">Blazer</option>
                                <option value="Shirt">Shirt</option>
                                <option value="Pant">Pant</option>
                                <option value="Skirt">Skirt</option>
                                <option value="Other">Other</option>
                            </select>
                            <input
                                type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Price"
                                value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required
                            />

                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h4 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-3">Initial Size (Optional)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Size" list="size-suggestions"
                                        value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })}
                                    />
                                    <datalist id="size-suggestions">
                                        {sizeOptions.map(size => <option key={size} value={size} />)}
                                    </datalist>
                                    <input
                                        type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Qty"
                                        value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                    />
                                    <input
                                        type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Alert Limit"
                                        value={newProduct.low_stock_threshold} onChange={e => setNewProduct({ ...newProduct, low_stock_threshold: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 p-3 bg-blue-600 dark:bg-orange-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-orange-700 transition-colors">Add Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Size Modal */}
            {showSizeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Add Size for {selectedProductForSize?.name}</h3>
                        <form onSubmit={handleAddSize} className="space-y-4">
                            <input
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="Size (e.g. 28, S, M)" list="size-suggestions"
                                value={newSize.size} onChange={e => setNewSize({ ...newSize, size: e.target.value })} required
                            />
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Initial Qty</label>
                                    <input
                                        type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="0"
                                        value={newSize.quantity} onChange={e => setNewSize({ ...newSize, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Low Alert Limit</label>
                                    <input
                                        type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500" placeholder="5"
                                        value={newSize.low_stock_threshold} onChange={e => setNewSize({ ...newSize, low_stock_threshold: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowSizeModal(false)} className="flex-1 p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 p-3 bg-blue-600 dark:bg-orange-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-orange-700 transition-colors">Save Size</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductManager;
