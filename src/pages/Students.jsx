import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { List, ListItem } from '../components/ui/List';
import Avatar from '../components/ui/Avatar';

export default function Students({ students, onNavigate }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex justify-between items-end mb-4">
                <h1 className="text-[34px] font-bold tracking-tight leading-tight">Öğrenciler</h1>
                <button
                    onClick={() => onNavigate('add-student')}
                    className="text-ios-blue text-[17px] font-medium mb-1 active:opacity-50"
                >
                    Ekle
                </button>
            </div>

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
        </div>
    );
}
