import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ onRefresh, isRefreshing, children }) => {
    const [pullDist, setPullDist] = useState(0);
    const [startY, setStartY] = useState(0);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (startY > 0) {
            const currentY = e.touches[0].clientY;
            let dist = currentY - startY;
            // Only allow pulling down if at the top of the page
            if (dist > 0 && dist < 150 && window.scrollY === 0) {
                // e.preventDefault();
                setPullDist(dist);
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDist > 80) {
            onRefresh();
        }
        setStartY(0);
        setPullDist(0);
    };

    return (
        <div
            className="w-full h-full relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {pullDist > 0 && (
                <div 
                    className="flex justify-center -mt-4 mb-4 md:hidden transition-transform z-50 absolute w-full top-0 left-0" 
                    style={{ transform: `translateY(${Math.min(pullDist, 80)}px)` }}
                >
                    <div className="bg-white rounded-full p-2 shadow-lg">
                        <RefreshCw 
                            className={`text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`} 
                            size={24} 
                            style={{ transform: `rotate(${pullDist * 2}deg)` }} 
                        />
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};

export default PullToRefresh;
