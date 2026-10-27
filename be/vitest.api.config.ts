    // Tests de API (*.api.test.ts): sin setup.ts ni base de datos, el service va simulado con vi.mock.
    import { defineConfig } from 'vitest/config';
    import dotenv from 'dotenv';

    dotenv.config({ path: '.env.test', override: true });

    export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.api.test.ts'],
    },
    });