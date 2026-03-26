import { createSlice } from '@reduxjs/toolkit';

const cartFromStorage = JSON.parse(localStorage.getItem('cartItems')) || [];

const calculateTotals = (items) => {
    return items.reduce(
        (acc, item) => {
            acc.totalQuantity += item.quantity;
            acc.totalAmount += item.price * item.quantity;
            return acc;
        },
        { totalQuantity: 0, totalAmount: 0 }
    );
};

const initialTotals = calculateTotals(cartFromStorage);

const initialState = {
    items: cartFromStorage,
    totalQuantity: initialTotals.totalQuantity,
    totalAmount: initialTotals.totalAmount,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.items.find((item) => item._id === newItem._id);

            if (!existingItem) {
                state.items.push({
                    ...newItem,
                    quantity: 1,
                });
            } else {
                existingItem.quantity++;
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalAmount = totals.totalAmount;
            localStorage.setItem('cartItems', JSON.stringify(state.items));
        },
        removeFromCart: (state, action) => {
            const id = action.payload;
            const existingItem = state.items.find((item) => item._id === id);

            if (existingItem.quantity === 1) {
                state.items = state.items.filter((item) => item._id !== id);
            } else {
                existingItem.quantity--;
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalAmount = totals.totalAmount;
            localStorage.setItem('cartItems', JSON.stringify(state.items));
        },
        deleteFromCart: (state, action) => {
            state.items = state.items.filter((item) => item._id !== action.payload);
            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalAmount = totals.totalAmount;
            localStorage.setItem('cartItems', JSON.stringify(state.items));
        },
        clearCart: (state) => {
            state.items = [];
            state.totalQuantity = 0;
            state.totalAmount = 0;
            localStorage.removeItem('cartItems');
        },
    },
});

export const { addToCart, removeFromCart, deleteFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
