import React from 'react';
import { getInitials } from '../../lib/utils';
import { getAvatarColor } from '../../lib/avatar';

/**
 * Avatar component for displaying user/student profile pictures or initials
 * @param {Object} props
 * @param {string} props.name - Full name for initials
 * @param {string} props.photo - Optional photo URL
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.className - Additional CSS classes
 */
export default function Avatar({
    name = '',
    photo = null,
    size = 'md',
    onClick = null,
    className = ''
}) {
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(name);

    // Size mapping
    const sizeClasses = {
        'sm': 'w-8 h-8 text-xs',
        'md': 'w-10 h-10 text-sm',
        'lg': 'w-12 h-12 text-base',
        'xl': 'w-16 h-16 text-lg'
    };

    const sizeClass = sizeClasses[size] || sizeClasses['md'];
    const clickableClass = onClick ? 'cursor-pointer active:scale-95 transition-transform' : '';

    return (
        <div
            className={`
                ${sizeClass} 
                rounded-full 
                ${!photo ? avatarColor : 'bg-white'} 
                text-white 
                flex 
                items-center 
                justify-center 
                font-bold 
                shadow-sm 
                overflow-hidden
                ${clickableClass}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {photo ? (
                <img
                    src={photo}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
