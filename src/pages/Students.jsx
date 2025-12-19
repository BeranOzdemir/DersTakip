import React, { useState } from 'react';
import { Plus, Search, BookOpen, User } from 'lucide-react';
import { List, ListItem } from '../components/ui/List';
import Avatar from '../components/ui/Avatar';
import { useInstitution } from '../contexts';
import Resources from './Resources';

export default function Students({ onNavigate, showToast }) {
    const { students } = useInstitution();
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list' or 'resources'

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex justify-between items-end mb-4">
                <h1 className="text-[34px] font-bold tracking-tight leading-tight">
                    {view === 'list' ? 'Öğrenciler' : 'Kaynaklar'}
                </h1>
                {view === 'list' && (
                    <button
                        onClick={() => onNavigate('add-student')}
                        className="text-ios-blue text-[17px] font-medium mb-1 active:opacity-50"
                    >
                        Ekle
                    </button>
                )}
            </div>

            {/* Segmented Control */}
            <div className="bg-gray-100 p-1 rounded-xl mb-6 flex">
                <button
                    onClick={() => setView('list')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'list'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <User size={16} />
                    Öğrenciler
                </button>
                <button
                    onClick={() => setView('resources')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'resources'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BookOpen size={16} />
                    Kaynaklar
                </button>
            </div>

            {view === 'list' ? (
                <>
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-[#E3E3E8] text-ios-text placeholder-gray-500 focus:outline-none focus:ring-0 transition-all focus:bg-white focus:shadow-sm"
                            placeholder="Ara"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    <List>
                        {filteredStudents.map((student) => {
                            return (
                                <ListItem
                                    key={student.id}
                                    title={
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={student.name}
                                                photo={student.photo}
                                                size="sm"
                                            />
                                            <span>{student.name}</span>
                                        </div>
                                    }
                                    subtitle={student.instrument}
                                    onClick={() => onNavigate('student-detail', student)}
                                    rightContent={
                                        <div className="text-right">
                                            {student.balance !== 0 ? (
                                                <div className={student.balance > 0 ? "text-ios-green font-medium" : "text-ios-red font-medium"}>
                                                    {student.balance > 0 ? `+${student.balance}₺` : `${student.balance}₺`}
                                                </div>
                                            ) : <div className="text-gray-400 text-sm">-</div>}
                                        </div>
                                    }
                                />
                            );
                        })}
                    </List>

                    {filteredStudents.length === 0 && (
                        <div className="text-center text-ios-subtext mt-10">
                            Öğrenci bulunamadı.
                        </div>
                    )}
                </>
            ) : (
                <div className="-mt-4"> {/* Negative margin to offset inner padding of Resources if any */}
                    <Resources showToast={showToast} embedded={true} />
                </div>
            )}
        </div>
    );
}
