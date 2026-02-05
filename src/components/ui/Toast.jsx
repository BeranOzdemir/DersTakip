import React, { useEffect } from 'react';
import { Check, AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', isVisible, onClose }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    // Premium iOS "Dynamic Island" Style
    // Black glass background with slight transparency
    // Top center positioning with slide-down animation

    let bgClass, iconColor;

    if (type === 'success') {
        bgClass = 'bg-ios-green';
        iconColor = 'text-white';
    } else if (type === 'error') {
        bgClass = 'bg-ios-red';
        iconColor = 'text-white';
    } else {
        bgClass = 'bg-ios-blue';
        iconColor = 'text-white';
    }

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-slide-down pointer-events-none">
            <div className={`${bgClass} backdrop-blur-md text-white px-2 py-2 pr-6 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] shadow-lg shadow-black/10`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/20`}>
                    {type === 'success' && <Check size={18} strokeWidth={3} className={iconColor} />}
                    {type === 'error' && <X size={18} strokeWidth={3} className={iconColor} />}
                    {type !== 'success' && type !== 'error' && <Info size={18} strokeWidth={3} className={iconColor} />}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-[15px] leading-tight tracking-wide drop-shadow-sm">{message}</span>
                </div>
            </div>
        </div>
    );
}
