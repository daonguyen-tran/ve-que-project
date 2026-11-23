import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sans les globals de Vitest, Testing Library ne nettoie pas le DOM tout seul entre deux tests.
afterEach(() => cleanup());
