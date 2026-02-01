import React, { useState, useEffect } from 'react';
import CameraComponent from '../components/CameraComponent';
import { markAttendance, getLivenessChallenge } from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import { MapPin, CheckCircle, XCircle, Loader, ShieldCheck } from 'lucide-react';

const AttendancePage = () => {
    const { latitude, longitude, error: geoError, loading: geoLoading, retry } = useGeolocation();
    const [status, setStatus] = useState('idle'); // idle, challenge, processing, success, rejected
    const [result, setResult] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const userName = localStorage.getItem('user_name') || 'Employee';

    const startAttendanceFlow = async () => {
        setStatus('loading_challenge');
        try {
            const chal = await getLivenessChallenge();
            setChallenge(chal);
            setStatus('challenge');
        } catch (err) {
            console.error("Failed to load challenge", err);
            alert("Could not initialize liveness check. Please try again.");
            setStatus('idle');
        }
    };

    const handleCapture = async (mainImage, sequence = []) => {
        if (geoError || !latitude) {
            alert("Location not available. Cannot mark attendance.");
            return;
        }

        setStatus('processing');
        try {
            const resp = await markAttendance({
                image_base64: mainImage,
                latitude,
                longitude,
                frames_base64: sequence,
                challenge_id: challenge?.id
            });
            setResult(resp);
            setStatus(resp.status === 'PRESENT' ? 'success' : 'rejected');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setResult({ message: err.response?.data?.detail || "Verification Failed" });
        }
    };

    const reset = () => {
        setStatus('idle');
        setResult(null);
        setChallenge(null);
    };

    return (
        <div className="min-h-screen pt-20 px-4 flex flex-col items-center justify-center">
            <div className="glass-card w-full max-w-lg p-6 text-center animate-slide-up">
                <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
                    Mark Attendance
                </h1>
                <p className="text-gray-300 mb-6">Welcome, <span className="text-indigo-400 font-bold">{userName}</span></p>

                {/* Location Status */}
                <div className="mb-6 flex justify-center">
                    {geoLoading ? (
                        <span className="flex items-center gap-2 text-yellow-400"><Loader className="animate-spin" size={16} /> Getting Location...</span>
                    ) : geoError ? (
                        <span className="flex items-center gap-2 text-red-400 cursor-pointer" onClick={retry}><MapPin size={16} /> Location Error (Retry)</span>
                    ) : (
                        <span className="flex items-center gap-2 text-green-400"><MapPin size={16} /> Location Active</span>
                    )}
                </div>

                {status === 'idle' && (
                    <div className="py-10">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck size={40} className="text-indigo-400" />
                        </div>
                        <p className="text-gray-400 mb-8">Secure liveness verification is required for today's attendance.</p>
                        <button
                            onClick={startAttendanceFlow}
                            className="btn-primary w-full max-w-xs"
                            disabled={geoLoading || geoError}
                        >
                            Start Verification
                        </button>
                    </div>
                )}

                {status === 'loading_challenge' && (
                    <div className="py-20 flex flex-col items-center">
                        <Loader className="animate-spin text-indigo-500" size={48} />
                        <p className="mt-4 text-gray-400">Preparing challenge...</p>
                    </div>
                )}

                {status === 'challenge' && (
                    <CameraComponent
                        onCapture={handleCapture}
                        challenge={challenge}
                        label="Verify & Mark Attendance"
                    />
                )}

                {status === 'processing' && (
                    <div className="py-20 flex flex-col items-center animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-indigo-500 blur-xl absolute opacity-50"></div>
                        <Loader className="animate-spin relative z-10" size={64} color="#6366f1" />
                        <p className="mt-6 text-xl font-semibold">Verifying Biometrics...</p>
                        <p className="text-gray-400 text-sm mt-2">Checking liveness & matching face</p>
                    </div>
                )}

                {(status === 'success' || status === 'rejected' || status === 'error') && (
                    <div className={`py-10 flex flex-col items-center animate-in zoom-in duration-300`}>
                        {status === 'success' ? (
                            <CheckCircle size={80} className="text-green-500 mb-4" />
                        ) : (
                            <XCircle size={80} className="text-red-500 mb-4" />
                        )}
                        <h3 className="text-2xl font-bold mb-2">
                            {status === 'success' ? 'Attendance Marked!' : 'Attendance Rejected'}
                        </h3>
                        <p className="text-gray-300 text-lg mb-6">{result?.message || result?.reason}</p>

                        <button onClick={reset} className="btn-primary w-full max-w-xs">
                            Mark Another
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AttendancePage;
