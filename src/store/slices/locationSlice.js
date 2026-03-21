import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedLocation: JSON.parse(localStorage.getItem('selectedLocation')) || null, // { lat, lng, label, accuracy, source, isApproximate }
    loading: false,
    error: null
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setLocation: (state, action) => {
            state.selectedLocation = action.payload;
            state.loading = false;
            state.error = null;
            if (action.payload) {
                localStorage.setItem('selectedLocation', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('selectedLocation');
            }
        },
        setLocationLoading: (state) => {
            state.loading = true;
        },
        setLocationError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearLocation: (state) => {
            state.selectedLocation = null;
            localStorage.removeItem('selectedLocation');
        }
    }
});

export const { setLocation, setLocationLoading, setLocationError, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;
