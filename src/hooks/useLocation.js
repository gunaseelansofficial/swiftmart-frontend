import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setLocation, setLocationLoading, setLocationError } from '../store/slices/locationSlice';

const geocodeCache = {};
let lastGeocodeTime = 0;

const useLocation = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [locationData, setLocationData] = useState({
        lat: null,
        lng: null,
        label: null,
        source: null,
        accuracy: null
    });

    const getAddressLabel = (address) => {
        return address.road || address.neighbourhood || address.suburb || address.city || address.town || 'Unknown Location';
    };

    const reverseGeocode = async (lat, lng) => {
        const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
        if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

        const now = Date.now();
        const wait = Math.max(0, 1000 - (now - lastGeocodeTime));
        if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
        
        lastGeocodeTime = Date.now();

        try {
            const { data } = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const label = getAddressLabel(data.address);
            geocodeCache[cacheKey] = { label, fullAddress: data.display_name };
            return geocodeCache[cacheKey];
        } catch (error) {
            console.error('Nominatim error:', error);
            return { label: 'Unknown Location', fullAddress: '' };
        }
    };

    const fetchIPLocation = async () => {
        try {
            const { data } = await axios.get('https://ipapi.co/json/');
            return {
                lat: data.latitude,
                lng: data.longitude,
                label: `${data.city}, ${data.region}`,
                source: 'ip',
                accuracy: 1000,
                isApproximate: true
            };
        } catch (error) {
            throw new Error('IP detection failed');
        }
    };

    const detectLocation = useCallback(async () => {
        setLoading(true);
        setError(null);
        dispatch(setLocationLoading());

        try {
            // Layer 1: GPS
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude, accuracy } = position.coords;
            const geocoded = await reverseGeocode(latitude, longitude);

            const data = {
                lat: latitude,
                lng: longitude,
                label: geocoded.label,
                fullAddress: geocoded.fullAddress,
                accuracy,
                source: 'gps',
                isApproximate: false
            };

            setLocationData(data);
            dispatch(setLocation(data));
            setLoading(false);
            return data;

        } catch (gpsError) {
            console.warn('GPS failed, falling back to IP:', gpsError.message);
            
            try {
                // Layer 3: IP Fallback
                const ipData = await fetchIPLocation();
                setLocationData(ipData);
                dispatch(setLocation(ipData));
                setLoading(false);
                return ipData;
            } catch (ipError) {
                const errMsg = 'Failed to detect location';
                setError(errMsg);
                dispatch(setLocationError(errMsg));
                setLoading(false);
                throw ipError;
            }
        }
    }, [dispatch]);

    // Auto-detect on mount
    useEffect(() => {
        detectLocation();
    }, []);

    return { 
        ...locationData, 
        loading, 
        error, 
        detectLocation 
    };
};

export default useLocation;
