import { useQuery } from '@tanstack/react-query';
import { circleMembers, familyContacts, safeWordStatus } from './api';
import { useAppStore } from './store';

export function useCircleMembers() {
  const circleId = useAppStore((s) => s.circleId);
  return useQuery({ queryKey: ['members', circleId], queryFn: () => circleMembers(circleId!), enabled: !!circleId });
}

export function useFamilyContacts() {
  const circleId = useAppStore((s) => s.circleId);
  return useQuery({ queryKey: ['familyContacts', circleId], queryFn: () => familyContacts(circleId!), enabled: !!circleId });
}

export function useSafeWordStatus() {
  const circleId = useAppStore((s) => s.circleId);
  return useQuery({ queryKey: ['safeWord', circleId], queryFn: () => safeWordStatus(circleId!), enabled: !!circleId });
}
