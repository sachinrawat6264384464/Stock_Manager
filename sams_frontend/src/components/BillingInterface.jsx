import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShoppingCart, Plus, Trash2, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BillingInterface = ({ isModal = false, onClose, formOnly = false }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Selection State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [lastBill, setLastBill] = useState(null);

    // State for Entry Mode
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualSize, setManualSize] = useState('');
    const [manualPrice, setManualPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('products/');
            setProducts(res.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const handleAddToCart = () => {
        if (isManualMode) {
            if (!manualName || !manualPrice || quantity <= 0) {
                setMessage('Please fill Name, Price and Quantity');
                return;
            }

            const item = {
                product_id: null,
                product_name: manualName,
                school: 'Manual Entry',
                product_size_id: null,
                size: manualSize || '-',
                quantity: parseInt(quantity),
                price: parseFloat(manualPrice),
                total: parseFloat(manualPrice) * parseInt(quantity)
            };

            setCart([...cart, item]);
            setMessage('');
            setManualName('');
            setManualSize('');
            setManualPrice('');
            setQuantity(1);
            return;
        }

        if (!selectedProduct || !selectedSize || quantity <= 0) return;

        const product = products.find(p => p.id === parseInt(selectedProduct));
        const sizeObj = product.sizes.find(s => s.id === parseInt(selectedSize));

        if (sizeObj.quantity <= 0) {
            setMessage('Out of Stock! Cannot bill this item.');
            return;
        }

        if (sizeObj.quantity < quantity) {
            setMessage(`Only ${sizeObj.quantity} left in stock!`);
            return;
        }

        const item = {
            product_id: product.id,
            product_name: product.name,
            school: product.school,
            product_size_id: sizeObj.id,
            size: sizeObj.size,
            quantity: parseInt(quantity),
            price: parseFloat(product.price),
            total: parseFloat(product.price) * parseInt(quantity)
        };

        setCart([...cart, item]);
        setMessage('');

        // Reset inputs
        setSelectedSize('');
        setQuantity(1);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const calculateTotal = () => cart.reduce((sum, item) => sum + item.total, 0);

    const handleSubmitBill = async () => {
        if (cart.length === 0) return;

        try {
            const payload = {
                customer_name: customerName,
                customer_phone: customerPhone,
                items: cart
            };
            const res = await api.post('bills/', payload);
            const billData = res.data;
            setLastBill(billData);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            fetchProducts(); // Refresh stock
            setMessage('Bill created successfully!');

            // Send SMS message
            if (customerPhone) {
                const message = `Hello ${customerName || 'Customer'},\nYour bill ${billData.bill_number} for ₹${billData.total_amount} has been generated successfully at SAMS VISNOI STORE.\nThank you for shopping!`;
                // Use sms: protocol. Note: Android uses ?body=, iOS uses &body=
                // But for most modern cases, ?body= works or simply opens the app.
                const smsUrl = `sms:${customerPhone.replace(/[\s+-]/g, '')}?body=${encodeURIComponent(message)}`;
                window.location.href = smsUrl;
            }
        } catch (error) {
            setMessage('Failed to create bill. ' + (error.response?.data?.error || ''));
        }
    };

    const downloadPDF = () => {
        if (!lastBill) return;

        const doc = new jsPDF();

        // Header - MP ONLINE
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('MP ONLINE', 105, 20, { align: 'center' });

        // Store Name
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235); // Blue color
        doc.text('SAMS VISNOI STORE', 105, 32, { align: 'center' });

        // Address
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('123 Fashion Street, City Center', 105, 40, { align: 'center' });

        // Phone and Email on same line
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const phoneText = 'Phone: +91 98765 43210';
        const emailText = 'Email: contact@samsstore.com';
        const fullContactText = `${phoneText}  |  ${emailText}`;
        doc.text(fullContactText, 105, 47, { align: 'center' });

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 52, 195, 52);

        // Bill To
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Bill To:', 15, 62);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(lastBill.customer_name || 'Walk-in Customer', 15, 68);

        // Invoice Number - right aligned
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Invoice No:', 150, 62);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(lastBill.bill_number, 195, 62, { align: 'right' });

        // Date - right aligned
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Date:', 165, 68);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(lastBill.date).toLocaleDateString('en-IN'), 195, 68, { align: 'right' });

        // Table - clean formatting like screenshot
        const tableColumn = ['ITEM', 'SIZE', 'QTY', 'PRICE', 'TOTAL'];
        const tableRows = lastBill.items.map(item => [
            item.product_name,
            item.size,
            item.quantity.toString(),
            `₹${parseFloat(item.price).toFixed(2)}`,
            `₹${parseFloat(item.subtotal).toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 78,
            theme: 'plain',
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 10,
                halign: 'left',
                lineWidth: { bottom: 0.5 },
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                fontSize: 10,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 65, halign: 'left' },
                1: { cellWidth: 30, halign: 'left' },
                2: { cellWidth: 25, halign: 'left' },
                3: { cellWidth: 35, halign: 'left' },
                4: { cellWidth: 40, halign: 'left' }
            },
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.5
            }
        });

        // Bottom line after table
        const finalY = doc.lastAutoTable.finalY;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, finalY, 195, finalY);

        // Grand Total
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Grand Total', 140, finalY + 10);

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`₹${parseFloat(lastBill.total_amount).toFixed(2)}`, 195, finalY + 12, { align: 'right' });

        // Footer
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for shopping with us!', 105, finalY + 30, { align: 'center' });
        doc.text('No returns or exchanges after 7 days.', 105, finalY + 36, { align: 'center' });

        // Save
        doc.save(`Invoice_${lastBill.bill_number}.pdf`);
    };

    const productObj = products.find(p => p.id === parseInt(selectedProduct));

    // Styles for printing - scoped to this component instance if possible, or global style block
    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            #printable-bill, #printable-bill * {
                visibility: visible;
            }
            #printable-bill {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 20px;
                background: white;
                z-index: 9999;
            }
        }
    `;

    return (
        <div className={`flex flex-col ${formOnly ? '' : 'lg:flex-row'} gap-6 ${isModal ? 'h-[80vh]' : 'h-[calc(100vh-8rem)]'}`}>
            <style>{printStyles}</style>

            {/* Left Side: Product Selection */}
            <div className={`w-full ${!formOnly && 'lg:w-1/2'} flex flex-col gap-6`}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Items to Bill</h2>
                        <button
                            onClick={() => {
                                setIsManualMode(!isManualMode);
                                setMessage('');
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isManualMode
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}
                        >
                            {isManualMode ? 'Switch to Selection' : 'Manual Entry?'}
                        </button>
                    </div>

                    {message && <p className="mb-4 text-red-500 text-sm font-bold">{message}</p>}

                    <div className="space-y-4">
                        {!isManualMode ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Product</label>
                                    <select
                                        className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                        value={selectedProduct}
                                        onChange={e => {
                                            setSelectedProduct(e.target.value);
                                            setSelectedSize('');
                                        }}
                                    >
                                        <option value="" className="dark:bg-slate-800">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.name} - {p.school}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Size</label>
                                        <select
                                            className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                            value={selectedSize}
                                            onChange={e => setSelectedSize(e.target.value)}
                                            disabled={!selectedProduct}
                                        >
                                            <option value="" className="dark:bg-slate-800">Select Size...</option>
                                            {productObj?.sizes.map(s => (
                                                <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.size} (Stock: {s.quantity})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Manual Product Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                        placeholder="e.g. Tie, Belt, Custom Coat"
                                        value={manualName}
                                        onChange={e => setManualName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Size</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                            placeholder="XL, 32"
                                            value={manualSize}
                                            onChange={e => setManualSize(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Price</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                            placeholder="0.00"
                                            value={manualPrice}
                                            onChange={e => setManualPrice(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAddToCart}
                            className="w-full py-3 bg-blue-600 dark:bg-orange-600 hover:bg-blue-700 dark:hover:bg-orange-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 mt-4 transition-all"
                        >
                            <Plus size={20} /> Add to Bill
                        </button>

                        {formOnly && (
                            <>
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Customer Name (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter customer name"
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 mb-4"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                    />
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Customer Phone (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter phone number (e.g. 91xxxxxxxxxx)"
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 mb-4"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                    />
                                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Items in Cart: <span className="font-bold">{cart.length}</span></p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">Total: ₹{calculateTotal()}</p>
                                    </div>
                                    <button
                                        onClick={handleSubmitBill}
                                        disabled={cart.length === 0}
                                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${cart.length === 0 ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' : 'bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 shadow-slate-900/20 dark:shadow-orange-900/20 active:scale-95'
                                            }`}
                                    >
                                        Generate Bill
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {lastBill && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                            {/* Printable Area - Same as InvoiceModal but inline here for now */}
                            <div id="printable-bill" className="p-8 bg-white text-slate-900">
                                <div className="text-center border-b border-slate-200 pb-6 mb-6">
                                    <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">INVOICE</h1>
                                    <h2 className="text-xl font-bold text-blue-600 mt-2">SAMS VISNOI STORE</h2>
                                    <p className="text-sm text-slate-500 mt-1">123 Fashion Street, City Center</p>
                                    <p className="text-sm text-slate-500">Phone: +91 98765 43210</p>
                                </div>

                                <div className="flex justify-between mb-8 text-sm">
                                    <div>
                                        <p className="text-slate-500">Bill To:</p>
                                        <p className="font-bold text-lg">{lastBill.customer_name || 'Walk-in Customer'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500">Invoice No:</p>
                                        <p className="font-bold">{lastBill.bill_number}</p>
                                        <p className="text-slate-500 mt-1">Date:</p>
                                        <p className="font-bold">{new Date(lastBill.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <table className="w-full text-left mb-6">
                                    <thead>
                                        <tr className="border-b-2 border-slate-800 text-sm uppercase">
                                            <th className="py-2">Item</th>
                                            <th className="py-2">Size</th>
                                            <th className="py-2 text-right">Qty</th>
                                            <th className="py-2 text-right">Price</th>
                                            <th className="py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lastBill.items.map((item, i) => (
                                            <tr key={i} className="text-sm">
                                                <td className="py-3 font-medium">
                                                    {item.product_name}
                                                    <span className="block text-xs text-slate-400">{item.product_school}</span>
                                                </td>
                                                <td className="py-3">{item.size}</td>
                                                <td className="py-3 text-right">{item.quantity}</td>
                                                <td className="py-3 text-right">₹{item.price}</td>
                                                <td className="py-3 text-right font-bold">₹{item.subtotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="border-t-2 border-slate-800 pt-4 flex justify-end">
                                    <div className="text-right">
                                        <p className="text-slate-500 text-sm">Grand Total</p>
                                        <p className="text-4xl font-bold text-slate-900">₹{lastBill.total_amount}</p>
                                    </div>
                                </div>

                                <div className="mt-12 text-center text-xs text-slate-400">
                                    <p>Thank you for shopping with us!</p>
                                    <p>No returns or exchanges after 7 days.</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 print:hidden">
                                <button
                                    onClick={() => setLastBill(null)}
                                    className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={downloadPDF}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                    <Download size={20} /> Download PDF
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                                >
                                    <Printer size={20} /> Print Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Cart Summary - Hidden in formOnly mode */}
            {!formOnly && (
                <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
                    <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <input
                            type="text"
                            placeholder="Customer Name (Optional)"
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Phone Number (Optional)"
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 mt-3"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                                <ShoppingCart size={48} className="mb-4 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 group">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{item.product_name}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-300">Size: {item.size} • Qty: {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-900 dark:text-white">₹{item.total}</span>
                                            <button
                                                onClick={() => removeFromCart(index)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-auto">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-slate-500 dark:text-slate-400">Total Amount</span>
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{calculateTotal()}</span>
                        </div>
                        <div className="flex gap-3">
                            {isModal && onClose && (
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSubmitBill}
                                disabled={cart.length === 0}
                                className={`flex-[2] py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${cart.length === 0 ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' : 'bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-700 shadow-slate-900/20 dark:shadow-orange-900/20 active:scale-95'
                                    }`}
                            >
                                Generate Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingInterface;
