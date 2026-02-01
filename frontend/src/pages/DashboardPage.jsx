import React, { useEffect, useState } from 'react';
import { getAttendance, deleteAttendance } from '../services/api';
import { Calendar, User, MapPin, Clock, Search, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

const DashboardPage = () => {
    const [records, setRecords] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [addressCache, setAddressCache] = useState({});
    const [showAll, setShowAll] = useState(false);

    // Get role from storage
    const role = localStorage.getItem('role') || 'EMPLOYEE';
    const userName = localStorage.getItem('user_name') || 'User';

    const fetchRecords = async () => {
        setLoading(true);
        try {
            // API now handles filtering based on token/role automatically
            // If showAll is true, pass null for date
            const data = await getAttendance(showAll ? null : date);
            setRecords(data);
            data.forEach(record => fetchAddress(record.location, record.id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this attendance record?")) {
            try {
                await deleteAttendance(id);
                fetchRecords();
            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete record.");
            }
        }
    };

    const fetchAddress = async (latLonStr, recordId) => {
        if (!latLonStr) return;
        if (addressCache[recordId]) return;

        try {
            const [lat, lon] = latLonStr.split(',').map(s => s.trim());
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
            const data = await res.json();
            const addr = data.display_name || "Unknown Location";
            const shortAddr = addr.split(',').slice(0, 3).join(',');
            setAddressCache(prev => ({ ...prev, [recordId]: shortAddr }));
        } catch (e) {
            console.error("Geo fetch failed", e);
            setAddressCache(prev => ({ ...prev, [recordId]: "Address Fetch Failed" }));
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [date, showAll]);

    return (
        <div className="min-h-screen pt-24 px-4 md:px-10 pb-10">
            <div className="max-w-7xl mx-auto animate-slide-up">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            {role === 'HR' ? 'HR Dashboard' : `Hello, ${userName}`}
                        </h2>
                        <p className="text-gray-400">
                            {role === 'HR' ? 'Track and manage all employee records.' : 'View your attendance history.'}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                        {/* Show All Toggle */}
                        <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/50">
                            <span className="text-sm text-gray-400">View All History</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showAll}
                                    onChange={() => setShowAll(!showAll)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className={`flex items-center gap-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md transition-opacity ${showAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <div className="flex items-center gap-2 px-3">
                                <Calendar size={18} className="text-indigo-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent border-none text-white p-1 focus:ring-0 m-0 w-auto text-sm font-medium outline-none"
                                    style={{ marginBottom: 0, zIndex: 10, position: 'relative' }}
                                />
                            </div>
                            <button
                                onClick={fetchRecords}
                                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-white"
                                title="Refresh Data"
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {loading && records.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 glass-card">
                        <p className="text-xl">No records found {showAll ? '' : `for ${date}`}.</p>
                    </div>
                ) : (
                    <div className="glass-table-container shadow-2xl overflow-x-auto">
                        <table className="glass-table w-full">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Status</th>
                                    <th>{showAll ? 'Date & Time' : 'Check-In Time'}</th>
                                    <th>Location</th>
                                    <th>Selfie</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="transition-colors">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                                                    {record.employee_name.charAt(0)}
                                                </div>
                                                <div className="hidden sm:block">
                                                    <p className="font-bold text-white">{record.employee_name}</p>
                                                    <p className="text-xs text-gray-400">ID: {record.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${record.status === 'PRESENT'
                                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                                                }`}>
                                                {record.status}
                                            </span>
                                            {record.rejection_reason && (
                                                <p className="text-[10px] text-red-400 mt-1 max-w-[150px] leading-tight">
                                                    {record.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1 text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-indigo-400" />
                                                    {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {showAll && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Calendar size={14} />
                                                        {new Date(record.time).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <div className="flex items-start gap-2 text-sm text-gray-300">
                                                    <MapPin size={16} className="text-pink-400 mt-1 shrink-0" />
                                                    <span className="max-w-[150px] md:max-w-[200px] truncate">
                                                        {addressCache[record.id] || "Fetching address..."}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 ml-6 mt-1">
                                                    {String(record.location).split(',')[0].substring(0, 6)}, ...
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {record.selfie_url ? (
                                                <div className="group relative w-10 h-10 rounded-full overflow-hidden border border-gray-600 cursor-pointer shadow-sm">
                                                    <img
                                                        src={`http://127.0.0.1:8000${record.selfie_url}`}
                                                        alt="Selfie"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-150"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <ExternalLink size={12} className="text-white" />
                                                    </div>
                                                    <a href={`http://127.0.0.1:8000${record.selfie_url}`} target="_blank" rel="noreferrer" className="absolute inset-0" />
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">No Img</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};



export default DashboardPage;
