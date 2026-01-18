import { supabase } from '../supabase';

export const productService = {
    // Obtener todos los productos (RLS filtra automáticamente por usuario)
    getProducts: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Crear un nuevo producto
    createProduct: async (product) => {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: product.name,
                price: parseFloat(product.price),
                stock: parseInt(product.stock),
                barcode: product.barcode || null,
                image_url: product.image || null,
                user_id: userData.user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Actualizar un producto existente
    updateProduct: async (id, updates) => {
        // Mapear 'image' del formulario a 'image_url' de la base de datos
        const dbUpdates = {
            name: updates.name,
            price: parseFloat(updates.price),
            stock: parseInt(updates.stock),
            barcode: updates.barcode || null,
            image_url: updates.image || null
        };

        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Eliminar un producto
    deleteProduct: async (id) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar producto por código de barras
    getProductByBarcode: async (barcode) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', barcode)
            .maybeSingle(); // Retorna null si no encuentra, en lugar de error

        if (error) throw error;
        return data;
    },

    // Obtener productos con poco stock (menos de 10 unidades)
    getLowStockProducts: async (threshold = 10) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .lte('stock', threshold)
            .order('stock', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};
