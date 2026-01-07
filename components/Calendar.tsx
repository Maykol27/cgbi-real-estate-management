import React, { useState } from 'react';

interface CalendarProps {
    events: { date: Date; title: string; color?: string; id: any }[];
    onDateClick?: (date: Date) => void;
    onEventClick?: (id: any) => void;
    readOnly?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ events, onDateClick, onEventClick, readOnly }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');

    // Navigation Handlers
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        if (view === 'week') newDate.setDate(newDate.getDate() - 7);
        if (view === 'day') newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        if (view === 'week') newDate.setDate(newDate.getDate() + 7);
        if (view === 'day') newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const isSameDate = (d1: Date | string, d2: Date | string) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const getEventsForDay = (date: Date) => events.filter(e => isSameDate(e.date, date));

    // --- Views ---

    const renderMonthView = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: firstDay }, (_, i) => i);

        return (
            <div className="grid grid-cols-7 gap-2">
                {blanks.map(i => <div key={`blank-${i}`} className="h-24 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg" />)}
                {days.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = getEventsForDay(date);
                    return (
                        <div
                            key={day}
                            onClick={() => !readOnly && onDateClick && onDateClick(date)}
                            className={`h-24 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-colors relative overflow-hidden group ${!readOnly ? 'hover:border-primary cursor-pointer' : ''}`}
                        >
                            <span className={`text-sm font-bold ${isSameDate(new Date(), date) ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-700 dark:text-gray-300'}`}>
                                {day}
                            </span>
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-hide">
                                {dayEvents.map((ev, idx) => (
                                    <div
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(ev.id); }}
                                        className={`text-[10px] truncate px-1.5 py-0.5 rounded border border-l-2 cursor-pointer transition-colors ${ev.color === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 border-l-emerald-500' :
                                            ev.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100 border-l-blue-500' :
                                                ev.color === 'red' ? 'bg-red-50 text-red-700 border-red-100 border-l-red-500' :
                                                    'bg-gray-50 text-gray-700 border-gray-200 border-l-gray-500'
                                            }`}
                                        title={ev.title}
                                    >
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday start
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });

        return (
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {weekDays.map((date, i) => (
                    <div key={i} className="bg-white dark:bg-card-dark min-h-[400px] flex flex-col relative group">
                        <div className={`p-2 text-center text-sm font-bold border-b border-gray-100 dark:border-gray-700 ${isSameDate(new Date(), date) ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {date.getDate()} {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                        <div
                            className="flex-1 p-2 space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                            onClick={() => !readOnly && onDateClick && onDateClick(date)}
                        >
                            {getEventsForDay(date).map((ev, idx) => (
                                <div
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(ev.id); }}
                                    className={`text-xs p-2 rounded border-l-4 cursor-pointer shadow-sm hover:translate-x-0.5 transition-transform ${ev.color === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' :
                                        ev.color === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-500' :
                                            ev.color === 'red' ? 'bg-red-50 text-red-800 border-red-500' :
                                                'bg-gray-50 text-gray-800 border-gray-400'
                                        }`}
                                >
                                    <p className="font-bold truncate">{ev.title}</p>
                                    <p className="text-[10px] opacity-80">{ev.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderDayView = () => {
        const events = getEventsForDay(currentDate);
        const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-card-dark">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-center font-bold text-lg dark:text-white">
                    {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[600px]">
                    {hours.map(hour => {
                        const hourEvents = events.filter(e => e.date.getHours() === hour);
                        const dateSlot = new Date(currentDate);
                        dateSlot.setHours(hour, 0, 0, 0);

                        return (
                            <div key={hour} className="flex min-h-[80px] group">
                                <div className="w-20 p-4 text-xs font-bold text-gray-400 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-900/30">
                                    {hour}:00
                                </div>
                                <div
                                    className="flex-1 p-2 relative cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                                    onClick={() => !readOnly && onDateClick && onDateClick(dateSlot)}
                                >
                                    {hourEvents.map((ev, idx) => {
                                        const width = 100 / hourEvents.length;
                                        const left = idx * width;

                                        return (
                                            <div
                                                key={idx}
                                                onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(ev.id); }}
                                                style={{ width: `${width}%`, left: `${left}%` }}
                                                className={`absolute p-2 rounded shadow-sm border-l-4 z-10 cursor-pointer overflow-hidden ${ev.color === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-500 top-2 bottom-2' :
                                                    ev.color === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-500 top-2 bottom-2' :
                                                        ev.color === 'red' ? 'bg-red-50 text-red-800 border-red-500 top-2 bottom-2' :
                                                            'bg-gray-50 text-gray-800 border-gray-400 top-2 bottom-2'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-xs leading-tight truncate">{ev.title}</span>
                                                </div>
                                                <span className="text-[10px] font-mono block mt-1">{ev.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold dark:text-white capitalize min-w-[200px]">
                        {view === 'month'
                            ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                            : view === 'week'
                                ? `Semana ${currentDate.getDate()} - ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 6).toLocaleDateString('es-ES', { month: 'short' })}`
                                : currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                        }
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm">
                            <span className="material-icons-round text-gray-600 dark:text-gray-300 text-sm">chevron_left</span>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all">
                            Hoy
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm">
                            <span className="material-icons-round text-gray-600 dark:text-gray-300 text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 w-full sm:w-auto">
                    {(['month', 'week', 'day'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${view === v
                                ? 'bg-white dark:bg-card-dark text-primary dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {view === 'month' && (
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                )}

                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
            </div>
        </div>
    );
};
