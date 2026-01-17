import { supabase } from '../supabase';

export const salesService = {
    // Crear una nueva venta
    createSale: async (saleData) => {
        const { data: userData } = await supabase.auth.getUser();

        // 1. Crear la venta principal
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                total: saleData.total,
                user_id: userData.user.id
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Crear los items de la venta
        const saleItems = saleData.items.map(item => ({
            sale_id: sale.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            user_id: userData.user.id
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);

        if (itemsError) throw itemsError;

        // 3. Actualizar stock de productos
        for (const item of saleData.items) {
            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: item.stock - item.quantity })
                .eq('id', item.id);

            if (stockError) console.error('Error actualizando stock:', stockError);
        }

        return sale;
    },

    // Obtener ventas de hoy
    getTodaySales: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Obtener ventas desde una fecha (con items)
    getSalesSince: async (startTime) => {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .gte('created_at', startTime)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Obtener todas las ventas (con paginación)
    getSales: async (limit = 50) => {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Obtener detalle de una venta
    getSaleDetails: async (saleId) => {
        const { data, error } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', saleId);

        if (error) throw error;
        return data || [];
    }
};
