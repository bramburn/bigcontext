"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: 'app.js',
                chunkFileNames: 'app.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        return 'app.css';
                    }
                    return 'assets/[name][extname]';
                },
                inlineDynamicImports: true,
                manualChunks: undefined
            }
        },
        target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88']
    }
});
//# sourceMappingURL=vite.config.js.map