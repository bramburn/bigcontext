import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Extend Vitest's expect with methods from testing-library/jest-dom
// This is already handled by tsconfig.json types: ["vitest/globals", "vitest/jsdom"]

// Runs cleanup after each test file
afterEach(() => {
  cleanup();
});

// Mock the MessageEvent for webview communication
// This is needed because MessageEvent is a browser global
// and might not be fully available or behave as expected in jsdom
if (typeof MessageEvent === 'undefined') {
  global.MessageEvent = class MessageEvent extends Event {
    data: any;
    constructor(type: string, eventInitDict?: MessageEventInit) {
      super(type, eventInitDict);
      this.data = eventInitDict?.data;
    }
  } as any;
}