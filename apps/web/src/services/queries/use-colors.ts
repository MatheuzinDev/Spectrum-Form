import { useQuery } from '@tanstack/react-query';

import { listColors } from '../color.service';

export const colorsQueryKey = ['colors'] as const;

const FIVE_MINUTES = 5 * 60 * 1000;

export function useColors() {
  return useQuery({
    queryKey: colorsQueryKey,
    queryFn: listColors,
    staleTime: FIVE_MINUTES,
  });
}
