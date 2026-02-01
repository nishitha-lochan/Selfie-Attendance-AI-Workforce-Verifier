import React, { useState } from 'react';
import CameraComponent from '../components/CameraComponent';
import { registerEmployee } from '../services/api';
import { UserPlus, CheckCircle, AlertCircle, Lock, Shield, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [designation, setDesignation] = useState('');
    const [isHr, setIsHr] = useState(false);
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
    const [msg, setMsg] = useState('');

    const handleCapture = (imgBase64) => {
        setImage(imgBase64);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            setMsg("Please capture a photo first.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMsg("Registering...");

        try {
            // Convert base64 to blob
            const res = await fetch(image);
            const blob = await res.blob();
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('name', name);
            // no email
            formData.append('password', password);
            formData.append('designation', designation);
            formData.append('is_hr', isHr);
            formData.append('file', file);

            const response = await registerEmployee(formData);
            setStatus('success');
            setMsg(response.message);
            // Reset form
            setName('');
            setPassword('');
            setDesignation('');
            setIsHr(false);
            setImage(null);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMsg(err.response?.data?.detail || "Registration Failed");
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 flex flex-col items-center">
            <div className="glass-card w-full max-w-2xl p-8 slide-up">
                <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                    New Registration
                </h2>

                <div className="mb-8">
                    {!image ? (
                        <CameraComponent onCapture={handleCapture} label="Capture Profile Photo" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <img src={image} alt="Captured" className="rounded-xl border-2 border-indigo-500 shadow-lg max-w-sm w-full" />
                            <button
                                onClick={() => setImage(null)}
                                className="mt-4 text-indigo-300 hover:text-white underline"
                            >
                                Retake Photo
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Create password"
                                className="pl-10 pr-10 w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2 text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Designation</label>
                        <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            required
                            placeholder="e.g. Software Engineer"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                        <input
                            type="checkbox"
                            id="isHr"
                            checked={isHr}
                            onChange={(e) => setIsHr(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isHr" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                            <Shield size={16} className="text-yellow-400" /> Register as HR Admin
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={`w-full btn-primary flex justify-center items-center gap-2 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {status === 'loading' ? 'Processing...' : (
                            <>
                                <UserPlus size={20} /> Register Employee
                            </>
                        )}
                    </button>
                </form>

                {status && (
                    <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${status === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {status === 'success' ? <CheckCircle /> : <AlertCircle />}
                        <span>{msg}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
