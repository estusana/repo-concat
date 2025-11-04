import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function that includes common providers
export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
