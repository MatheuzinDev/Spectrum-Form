import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// O Testing Library não desmonta sozinho quando `globals: false`: sem isto, um
// componente de um teste sobrevive no DOM e o `getByRole` do teste seguinte
// encontra dois elementos, falhando por uma razão que não é a que ele testa.
afterEach(cleanup);
