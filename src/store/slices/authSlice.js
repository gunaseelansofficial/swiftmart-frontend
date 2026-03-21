import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        setUser: (state, action) => {
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        toggleWishlist: (state, action) => {
            if (state.user) {
                if (!state.user.wishlist) state.user.wishlist = [];
                const index = state.user.wishlist.indexOf(action.payload);
                if (index === -1) {
                    state.user.wishlist.push(action.payload);
                } else {
                    state.user.wishlist.splice(index, 1);
                }
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        }
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser, toggleWishlist } = authSlice.actions;
export default authSlice.reducer;
