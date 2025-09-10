"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('File Scanning Progress Message Contracts', () => {
    // Mock the postMessage function that would typically be provided by VS Code API
    const mockPostMessage = vitest_1.vi.fn();
    // Simulate the backend sending a message to the webview
    const sendMessageToWebview = (message) => {
        mockPostMessage(message);
    };
    beforeEach(() => {
        mockPostMessage.mockClear();
    });
    (0, vitest_1.it)('should send a valid scanStart message', () => {
        const message = {
            type: 'scanStart',
            payload: {
                message: 'Scanning full file structure...',
            },
        };
        sendMessageToWebview(message);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            type: 'scanStart',
            payload: vitest_1.expect.objectContaining({
                message: vitest_1.expect.any(String),
            }),
        }));
    });
    (0, vitest_1.it)('should send a valid scanProgress message', () => {
        const message = {
            type: 'scanProgress',
            payload: {
                scannedFiles: 100,
                ignoredFiles: 10,
                message: 'Scanned 100 files, 10 ignored...',
            },
        };
        sendMessageToWebview(message);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            type: 'scanProgress',
            payload: vitest_1.expect.objectContaining({
                scannedFiles: vitest_1.expect.any(Number),
                ignoredFiles: vitest_1.expect.any(Number),
                message: vitest_1.expect.any(String),
            }),
        }));
    });
    (0, vitest_1.it)('should send a valid scanComplete message', () => {
        const message = {
            type: 'scanComplete',
            payload: {
                totalFiles: 1000,
                ignoredFiles: 50,
                message: 'Scan complete: 1000 files in repo, 50 files not considered.',
            },
        };
        sendMessageToWebview(message);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockPostMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            type: 'scanComplete',
            payload: vitest_1.expect.objectContaining({
                totalFiles: vitest_1.expect.any(Number),
                ignoredFiles: vitest_1.expect.any(Number),
                message: vitest_1.expect.any(String),
            }),
        }));
    });
});
//# sourceMappingURL=progress-messages.test.js.map