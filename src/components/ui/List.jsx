import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function List({ children, className }) {
    return (
        <div className={cn("bg-ios-card rounded-xl shadow-ios overflow-hidden", className)}>
            <div className="divide-y divide-ios-separator pl-4">
                {children}
            </div>
        </div>
    );
}

export function ListItem({ title, subtitle, rightContent, onClick, className }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center justify-between py-3 pr-4 active:bg-gray-50 transition-colors -ml-4 pl-4 cursor-pointer",
                className
            )}
        >
            <div className="flex-1 min-w-0">
                <div className="font-medium text-[17px] text-ios-text truncate">{title}</div>
                {subtitle && <div className="text-[15px] text-ios-subtext truncate mt-0.5">{subtitle}</div>}
            </div>
            <div className="flex items-center text-ios-subtext gap-2">
                {rightContent}
                <ChevronRight size={20} className="text-gray-300" />
            </div>
        </div>
    );
}
