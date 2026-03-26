import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join', `user_${user._id}`);

                if (user.role === 'admin') {
                    newSocket.emit('admin:join');
                }

                if (user.role === 'delivery_partner') {
                    newSocket.emit('partner:go_online_register', { partnerId: user._id });
                }
            });

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user?._id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
