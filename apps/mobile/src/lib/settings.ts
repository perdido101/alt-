import type { ProtectionLevel } from '@alt/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from './store';
import { supabase } from './supabase';

/** Circle settings a guardian changes; the parent's phone picks them up on its next sync. */
export function useCircleSettings() {
  const circleId = useAppStore((s) => s.circleId);
  return useQuery({
    queryKey: ['circleSettings', circleId],
    queryFn: async () => {
      const { data, error } = await supabase.from('circles').select('name, plan, protection_level, quiz_interval_days').eq('id', circleId!).single();
      if (error) throw error;
      return data as { name: string; plan: string; protection_level: ProtectionLevel; quiz_interval_days: number };
    },
    enabled: !!circleId,
  });
}

export function useUpdateCircle() {
  const circleId = useAppStore((s) => s.circleId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<{ name: string; protection_level: ProtectionLevel; quiz_interval_days: number }>) => {
      const { error } = await supabase.from('circles').update(patch).eq('id', circleId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circleSettings', circleId] }),
  });
}

export function useProtectionLevel() {
  const settings = useCircleSettings();
  const update = useUpdateCircle();
  return {
    level: update.variables?.protection_level ?? settings.data?.protection_level ?? 'warn',
    set: (level: ProtectionLevel) => update.mutate({ protection_level: level }),
  };
}
