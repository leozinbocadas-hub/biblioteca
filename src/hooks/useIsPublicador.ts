import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useIsPublicador = () => {
  const { user } = useAuth();
  const [isPublicador, setIsPublicador] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPublicador = async () => {
      if (!user) {
        setIsPublicador(false);
        setLoading(false);
        return;
      }

      try {
        let { data, error } = await supabase
          .from('usuarios')
          .select('id, email, is_publicador')
          .eq('id', user.id)
          .maybeSingle();

        if (!data) {
          const resByEmail = await supabase
            .from('usuarios')
            .select('id, is_publicador')
            .eq('email', user.email)
            .maybeSingle();
          data = resByEmail.data as any;
          error = resByEmail.error as any;
        }

        setIsPublicador(!!data?.is_publicador);
      } catch (err) {
        console.error('❌ Erro ao verificar publicador:', err);
        setIsPublicador(false);
      } finally {
        setLoading(false);
      }
    };

    checkPublicador();
  }, [user]);

  return { isPublicador, loading };
};
