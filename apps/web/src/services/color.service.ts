import { colorListSchema, type Color } from '@repo/shared';

import { http } from './http';

const sampleDataEnabled = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false';

export async function listColors(): Promise<Color[]> {
  if (sampleDataEnabled) {
    const { colorsFixture } = await import('@/tests/fixtures');
    return colorsFixture;
  }

  return colorListSchema.parse(await http.get('/api/colors'));
}
