import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to synchronize database changes in real-time.
 * Listens to all 'postgres_changes' on the 'public' schema.
 * 
 * @param onUpdate Callback function to be executed when any change is detected.
 * @param tables Array of table names to listen to (optional, defaults to all in public schema).
 */
export function useDatabaseSync(onUpdate: () => void, tables: string[] = ['*']) {
    const onUpdateRef = useRef(onUpdate);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        console.log('📡 Setting up database sync for tables:', tables);

        const channel = supabase.channel('global_db_sync');

        if (tables.includes('*')) {
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    console.log('🔄 Change detected in database:', payload.table, payload.eventType);
                    onUpdateRef.current();
                }
            );
        } else {
            tables.forEach(table => {
                channel.on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    (payload) => {
                        console.log(`🔄 Change detected in ${table}:`, payload.eventType);
                        onUpdateRef.current();
                    }
                );
            });
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Synchronized with database.');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('❌ database sync channel error');
            }
        });

        return () => {
            console.log('📴 Cleaning up database sync');
            supabase.removeChannel(channel);
        };
    }, [tables.join(',')]);
}
