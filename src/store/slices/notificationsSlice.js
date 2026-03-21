import { createSlice } from '@reduxjs/toolkit';

const getInitialNotifications = () => {
    try {
        const stored = localStorage.getItem('notifications');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const initialNotifications = getInitialNotifications();

const initialState = {
    notifications: initialNotifications,
    unreadCount: initialNotifications.filter(n => !n.read).length,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            const newNotification = {
                id: Date.now(),
                ...action.payload,
                read: false,
                createdAt: new Date().toISOString(),
            };
            state.notifications = [newNotification, ...state.notifications].slice(0, 50); // Keep last 50
            state.unreadCount += 1;
            localStorage.setItem('notifications', JSON.stringify(state.notifications));
        },
        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount -= 1;
                localStorage.setItem('notifications', JSON.stringify(state.notifications));
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(n => (n.read = true));
            state.unreadCount = 0;
            localStorage.setItem('notifications', JSON.stringify(state.notifications));
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
            localStorage.removeItem('notifications');
        },
    },
});

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
