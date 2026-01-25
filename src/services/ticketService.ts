import { supabase } from '../../lib/supabaseClient';
import { Ticket } from '../types';
import { tryCatch, AppError } from '../utils/errorHandler';

export const TicketService = {
    async getAll(): Promise<[Ticket[] | null, AppError | null]> {
        const { data, error } = await supabase.from('tickets').select('*');
        if (error) return [null, new AppError(error.message, 'DB_READ_ERROR')];
        return [data as unknown as Ticket[], null];
    },

    async updateStatus(id: number | string, status: Ticket['status']): Promise<[boolean, AppError | null]> {
        // DB Call First (Zombie Fix Pattern)
        const { error } = await supabase
            .from('tickets')
            .update({ status })
            .eq('id', id);

        if (error) {
            return [false, new AppError(error.message, 'DB_UPDATE_ERROR')];
        }
        return [true, null];
    },

    async updatePriority(id: number | string, priority: Ticket['priority']): Promise<[boolean, AppError | null]> {
        const { error } = await supabase
            .from('tickets')
            .update({ priority })
            .eq('id', id);

        if (error) {
            return [false, new AppError(error.message, 'DB_UPDATE_ERROR')];
        }
        return [true, null];
    }
};
