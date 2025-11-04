import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock File API
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;

  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.size || 0), 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
    this.webkitRelativePath = '';
  }

  async text(): Promise<string> {
    return '';
  }

  slice(): Blob {
    return new Blob();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  stream(): ReadableStream {
    return new ReadableStream();
  }
} as any;

// Mock atob (for GitHub service tests)
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
