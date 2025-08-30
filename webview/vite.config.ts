import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// Optimize bundle size
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		// Consolidate to a single JS bundle to simplify webview resource loading
		rollupOptions: {
			output: {
				manualChunks: undefined,
				inlineDynamicImports: true,
				entryFileNames: 'app.js',
				chunkFileNames: 'app.js',
				assetFileNames: (assetInfo) => {
					if (assetInfo.name && assetInfo.name.endsWith('.css')) {
						return 'app.css';
					}
					return 'assets/[name][extname]';
				}
			},
		},
		// Set chunk size warning limit
		chunkSizeWarningLimit: 2000,
		target: ['es2020','chrome87','safari14','firefox78','edge88']
	},
	// Optimize dependencies
	optimizeDeps: {
		include: ['@fluentui/web-components'],
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
