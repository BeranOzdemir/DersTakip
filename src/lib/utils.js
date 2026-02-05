import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useRef, useEffect } from 'react'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Safely parse an amount from user input
 * @param {string|number} value - Input value
 * @returns {number|null} Parsed amount or null if invalid
 */
export function parseAmount(value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
        return null;
    }
    return num;
}

/**
 * Format date and time for Turkish locale
 * @param {Date} date - Date to format (defaults to now)
 * @returns {Object} Object with date, time, and shortDate
 */
export function formatDateTime(date = new Date()) {
    return {
        date: date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        shortDate: date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        })
    };
}

/**
 * Get initials from a full name
 * @param {string} name - Full name
 * @returns {string} Uppercase initials (max 2 characters)
 */
export function getInitials(name) {
    if (!name) return '';
    return name.split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

/**
 * Custom hook to debounce a callback function
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}
