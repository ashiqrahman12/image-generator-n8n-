import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for image history
export interface ImageHistoryItem {
    id: string;
    user_id: string;
    image_url: string;
    prompt: string;
    style_preset: string | null;
    created_at: string;
}

// Helper functions for image history operations
export async function saveImageToHistory(
    userId: string,
    imageUrl: string,
    prompt: string,
    stylePreset?: string
): Promise<ImageHistoryItem | null> {
    const { data, error } = await supabase
        .from('image_history')
        .insert({
            user_id: userId,
            image_url: imageUrl,
            prompt: prompt,
            style_preset: stylePreset || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving image to history:', error);
        return null;
    }

    return data;
}

export async function getImageHistory(userId: string): Promise<ImageHistoryItem[]> {
    const { data, error } = await supabase
        .from('image_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching image history:', error);
        return [];
    }

    return data || [];
}

export async function deleteImageFromHistory(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('image_history')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting image:', error);
        return false;
    }

    return true;
}

export async function clearAllHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('image_history')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error clearing history:', error);
        return false;
    }

    return true;
}
