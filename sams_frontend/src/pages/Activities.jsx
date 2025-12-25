import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Clock, Printer, Download, Search, Filter, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Activities = () => {
    const [activities, setActivities] = useState([]);
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await api.get('activities/');
                setActivities(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchActivities();
    }, []);

    const filteredActivities = activities.filter(activity => {
        const matchesType = filterType === 'ALL' || activity.action_type === filterType;
        const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.action_type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const headers = ['Type', 'Description', 'Time'];
        const csvContent = [
            headers.join(','),
            ...filteredActivities.map(activity => [
                activity.action_type,
                `"${activity.description.replace(/"/g, '""')}"`, // Escape quotes
                new Date(activity.timestamp).toLocaleString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activities_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const downloadRowCSV = (activity) => {
        const headers = ['Type', 'Description', 'Time'];
        const csvContent = [
            headers.join(','),
            [
                activity.action_type,
                `"${activity.description.replace(/"/g, '""')}"`,
                new Date(activity.timestamp).toLocaleString()
            ].join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activity_${activity.id}.csv`;
        link.click();
    };

    const printRowPDF = (activity) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Activity Details", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Type: ${activity.action_type}`, 20, 40);
        doc.text(`Time: ${new Date(activity.timestamp).toLocaleString()}`, 20, 50);

        doc.text("Description:", 20, 70);
        const splitDescription = doc.splitTextToSize(activity.description, 170);
        doc.text(splitDescription, 20, 80);

        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDeleteActivity = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) return;
        try {
            await api.delete(`activities/${id}/`);
            setActivities(activities.filter(a => a.id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete activity');
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Clock className="text-blue-600 dark:text-orange-500" /> Activity Log
                </h2>
                <div className="flex gap-2 print:hidden">
                    <button onClick={handlePrint} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Printer size={20} /> Print
                    </button>
                    <button onClick={handleDownload} className="bg-blue-600 dark:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-orange-700 transition-colors">
                        <Download size={20} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 print:hidden transition-colors duration-300">

                <div className="w-full md:w-64 relative">
                    <Filter className="absolute left-3 top-3 text-slate-400" size={20} />
                    <select
                        className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 appearance-none bg-white dark:bg-slate-700 dark:text-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="ALL">All Types</option>
                        <option value="SALE">Sale</option>
                        <option value="STOCK_IN">Stock In</option>

                    </select>
                </div>
            </div>
            <div className="h-[calc(84vh-180px)] overflow-y-auto pr-2">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-x-auto print:border-none print:shadow-none transition-colors duration-300">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-6 font-medium">Type</th>
                                <th className="p-6 font-medium">Description</th>
                                <th className="p-6 font-medium">Time</th>
                                <th className="p-6 font-medium print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredActivities.length > 0 ? (
                                filteredActivities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${activity.action_type === 'SALE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                activity.action_type === 'STOCK_IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {activity.action_type}
                                            </span>
                                        </td>
                                        <td className="p-6 text-slate-700 dark:text-slate-200 font-medium">
                                            {activity.description}
                                        </td>
                                        <td className="p-6 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-6 flex gap-2 print:hidden">
                                            <button
                                                onClick={() => printRowPDF(activity)}
                                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Print Receipt"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button
                                                onClick={() => downloadRowCSV(activity)}
                                                className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Download CSV"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteActivity(activity.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Activity"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400 italic">
                                        No activities found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Activities;
