import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'VirtualTable',
            fileName: () => `VirtualTable.js`,
            formats: ['es'],
        },
        rollupOptions: {
            // Externalize dependencies you don't want bundled
            external: [],
            output: {
                // Provide global variables for UMD build here if needed
            },
        },
        sourcemap: true,
        outDir: 'dist',
        emptyOutDir: false,
    },
    plugins: [
        dts({
            rollupTypes: true,
        }),
    ],
    server: {
        port: 8080,
        strictPort: false,
        open: '/test/',
        hmr: true,
        fs: {
            allow: [
                resolve(__dirname, 'test'),
                resolve(__dirname, 'dist'),
                resolve(__dirname, 'src'),
            ]
        },
        watch: {
            // Watch for changes in test and dist folders if needed
            ignored: [
                'node_modules/**',
            ],

        },
    },
});