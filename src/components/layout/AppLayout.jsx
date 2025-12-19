import React from 'react';
import { Home, Users, Calendar, Wallet, Settings, Library } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AppLayout({ children, activeTab, onTabChange, hideTabBar }) {
    const tabs = [
        { id: 'dashboard', label: 'Özet', icon: Home },
        { id: 'students', label: 'Öğrenciler', icon: Users },
        { id: 'schedule', label: 'Program', icon: Calendar },
        { id: 'resources', label: 'Kaynaklar', icon: Library },
        { id: 'finance', label: 'Finans', icon: Wallet },
        { id: 'settings', label: 'Ayarlar', icon: Settings },
    ];

    return (
        <div className="flex flex-col h-screen w-full bg-ios-bg text-ios-text overflow-hidden relative">
            {/* Safe Area Top Background */}
            <div className="absolute top-0 left-0 right-0 h-safe-top bg-ios-bg z-50"></div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[83px] safe-area-top safe-area-bottom">
                <div className="min-h-full px-4 pt-4">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation */}
            {!hideTabBar && (
                <div className="absolute bottom-0 left-0 right-0 z-50">
                    {/* Blur Container */}
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-ios-separator"></div>

                    {/* Safe Area Spacer */}
                    <div className="safe-area-bottom bg-transparent relative z-10">
                        <nav className="flex items-center justify-around h-[64px] pb-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className="flex flex-col items-center justify-center w-full h-full active:opacity-50 transition-opacity"
                                    >
                                        <Icon
                                            size={32}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={cn(
                                                "mb-[3px] transition-colors duration-200",
                                                isActive ? "text-ios-blue" : "text-ios-subtext"
                                            )}
                                        />
                                        <span className={cn(
                                            "text-[10px] font-medium transition-colors duration-200",
                                            isActive ? "text-ios-blue" : "text-ios-subtext"
                                        )}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
