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
		// Enable tree-shaking
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Separate vendor chunks for better caching
					if (id.includes('node_modules')) {
						if (id.includes('@fluentui/web-components')) {
							return 'fluent-ui';
						}
						return 'vendor';
					}
				},
			},
		},
		// Set chunk size warning limit
		chunkSizeWarningLimit: 1000,
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
