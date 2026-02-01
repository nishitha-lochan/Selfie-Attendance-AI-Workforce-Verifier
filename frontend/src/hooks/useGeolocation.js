import { useState, useEffect } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        error: null,
        loading: true,
    });

    const getLocation = () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));
        if (!navigator.geolocation) {
            setLocation({
                latitude: null,
                longitude: null,
                error: "Geolocation is not supported by your browser",
                loading: false,
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setLocation({
                    latitude: null,
                    longitude: null,
                    error: `Location Error: ${error.message}`,
                    loading: false,
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        getLocation();
    }, []);

    return { ...location, retry: getLocation };
};

export default useGeolocation;
