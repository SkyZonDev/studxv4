import { useContext } from 'react';
import { CalendarContext } from '../context/calendarContext';

export const useCalendar = () => {
    const context = useContext(CalendarContext);

    if (!context) {
        throw new Error('useCalendar doit être utilisé à l\'intérieur d\'un CalendarProvider');
    }

    return context;
};
