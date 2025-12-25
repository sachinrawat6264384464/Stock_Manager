import { Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceModal = ({ bill, onClose }) => {
    if (!bill) return null;

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("INVOICE", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Bill No: ${bill.bill_number}`, 20, 40);
        doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, 20, 50);
        doc.text(`Customer: ${bill.customer_name}`, 20, 60);

        const tableColumn = ["Item", "Size", "Qty", "Price", "Amount"];
        const tableRows = [];

        bill.items.forEach(item => {
            const itemData = [
                item.product_name,
                item.size,
                item.quantity,
                item.price,
                item.subtotal
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 70,
        });

        doc.text(`Total Amount: ${bill.total_amount}`, 140, doc.lastAutoTable.finalY + 15);
        doc.save(`${bill.bill_number}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors">

                {/* Printable Area */}
                <div id="printable-bill" className="p-8 bg-white text-slate-900">
                    <div className="text-center border-b border-slate-200 pb-6 mb-6">
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">MP ONline</h1>
                        <h2 className="text-xl font-bold text-blue-600 mt-2">SAMS VISNOI STORE</h2>
                        <p className="text-sm text-slate-500 mt-1">123 Fashion Street, City Center</p>
                        <div className="flex justify-center gap-4 mt-2 text-sm text-slate-600">
                            <p><strong>Phone:</strong> +91 98765 43210</p>
                            <p>|</p>
                            <p><strong>Email:</strong> contact@samsstore.com</p>
                        </div>
                    </div>

                    <div className="flex justify-between mb-8 text-sm">
                        <div>
                            <p className="text-slate-500">Bill To:</p>
                            <p className="font-bold text-lg">{bill.customer_name || 'Walk-in Customer'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500">Invoice No:</p>
                            <p className="font-bold">{bill.bill_number}</p>
                            <p className="text-slate-500 mt-1">Date:</p>
                            <p className="font-bold">{new Date(bill.date).toLocaleDateString()}</p>
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
                            {bill.items.map((item, i) => (
                                <tr key={i} className="text-sm">
                                    <td className="py-3 font-medium">
                                        {item.product_name}
                                        <span className="block text-xs text-slate-400">{item.product_school || ''}</span>
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
                            <p className="text-4xl font-bold text-slate-900">₹{bill.total_amount}</p>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-xs text-slate-400">
                        <p>Thank you for shopping with us!</p>
                        <p>No returns or exchanges after 7 days.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row justify-end gap-3 print:hidden sticky bottom-0 z-10 transition-colors">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors order-3 sm:order-1"
                    >
                        Close
                    </button>
                    <button
                        onClick={generatePDF}
                        className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors order-2"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="w-full sm:w-auto px-6 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors order-1 sm:order-3"
                    >
                        <Printer size={20} /> Print
                    </button>
                </div>
            </div>

            <style>
                {`
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
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default InvoiceModal;
