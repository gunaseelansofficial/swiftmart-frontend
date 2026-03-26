import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const { items } = useSelector((state) => state.cart || { items: [] });
  
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Categories', path: '/category/all', icon: Grid },
    { name: 'Cart', path: '/cart', icon: ShoppingBag, badge: items.length },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                isActive ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-primary" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
