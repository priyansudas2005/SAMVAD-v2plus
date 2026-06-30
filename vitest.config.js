// SAMVAD V2.0 — root-level vitest config (no tests here).
// Frontend React component tests and TypeScript compilation checks
// live in frontend/ and are run via: cd frontend && npm run build
// Backend API tests live in backend/tests/ and are run via: pytest tests/test_api.py

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [],          // No test files at repo root
        environment: 'node',
    },
});
