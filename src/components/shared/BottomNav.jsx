import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useSelector } from 'react-redux';

const BottomNav = () => {
  const { items } = useSelector((state) => state.cart || { items: [] });
  
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Categories', path: '/category/all', icon: Grid },
    { name: 'Cart', path: '/cart', icon: ShoppingBag, badge: items.length },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-primary" />
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
