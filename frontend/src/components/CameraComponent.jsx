import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

const CameraComponent = ({ onCapture, label = "Capture Photo", challenge = null, isCapturing = false }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Cannot access camera. Please allow permissions.");
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Sequence Capture Logic
    useEffect(() => {
        if (isCapturing && challenge) {
            handleSequenceCapture();
        }
    }, [isCapturing]);

    const handleSequenceCapture = async () => {
        const frames = [];
        const captureDuration = 4000; // 4 seconds
        const frameInterval = 100; // Capture every 100ms (increased from 200ms)
        const startTime = Date.now();

        setCountdown(4);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const captureTimer = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas) {
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const frame = canvas.toDataURL('image/jpeg', 0.6); // Lower quality for speed
                frames.push(frame);
            }

            if (Date.now() - startTime >= captureDuration) {
                clearInterval(captureTimer);
                clearInterval(countdownInterval);
                setCountdown(null);
                // Return sequence and the last frame as primary image
                onCapture(frames[frames.length - 1], frames);
            }
        }, frameInterval);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(imageBase64);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-indigo-500/50">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Challenge Overlay */}
                {challenge && (
                    <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <p className="text-yellow-400 font-bold text-center text-lg animate-pulse">
                            TASK: {challenge.instruction}
                        </p>
                    </div>
                )}

                {/* Countdown Overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <span className="text-6xl font-black text-white drop-shadow-lg animate-ping">
                            {countdown}
                        </span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 text-red-500 p-4 text-center">
                        {error}
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {!isCapturing && (
                <button
                    onClick={challenge ? handleSequenceCapture : capturePhoto}
                    disabled={isCapturing}
                    className="mt-6 flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    <Camera size={24} />
                    {challenge ? "Start Liveness Check" : label}
                </button>
            )}
        </div>
    );
};

export default CameraComponent;
