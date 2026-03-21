import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoryReducer from './slices/categorySlice';
import cartReducer from './slices/cartSlice';
import locationReducer from './slices/locationSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoryReducer,
        cart: cartReducer,
        location: locationReducer,
        notifications: notificationsReducer,
    },
});
