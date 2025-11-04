# Testing Guide

This document provides detailed information about the testing infrastructure and practices in the File Concatenator project.

## Overview

The project uses a modern testing stack:

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) - React component testing utilities
- **DOM Environment**: jsdom - Simulates browser environment for tests
- **Coverage**: v8 - Built-in code coverage reporting

## Test Statistics

- **Total Tests**: 188
- **Test Suites**: 5
- **Coverage Areas**:
  - Pattern matching utilities (47 tests)
  - File processing utilities (40 tests)
  - Concatenation utilities (34 tests)
  - GitHub service (38 tests)
  - Zustand store (29 tests)

## Running Tests

### Watch Mode

Run tests continuously during development:

```bash
npm test
```

### Single Run

Run all tests once (useful for CI):

```bash
npm run test:run
```

### UI Mode

Launch the interactive Vitest UI:

```bash
npm run test:ui
```

This opens a browser interface at `http://localhost:51204` with:
- Visual test results
- File-by-file breakdown
- Real-time test execution
- Code coverage visualization

### Coverage Report

Generate a detailed coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in multiple formats:
- **Console**: Summary in terminal
- **HTML**: Interactive report in `coverage/` directory
- **JSON**: Machine-readable format for CI tools
- **LCOV**: For integration with coverage services

## Test Structure

### Unit Tests

#### Pattern Utilities (`src/utils/patternUtils.test.ts`)

Tests pattern matching functionality:
- Glob to regex conversion
- Extension, glob, regex, and path pattern matching
- Pattern validation
- Pattern suggestion generation

```typescript
describe('patternUtils', () => {
  describe('matchesPattern', () => {
    it('should match files by extension', () => {
      const pattern: ExcludePattern = {
        id: '1',
        type: 'extension',
        pattern: '.js',
        enabled: true
      };
      expect(matchesPattern('file.js', pattern)).toBe(true);
    });
  });
});
```

#### File Utilities (`src/utils/fileUtils.test.ts`)

Tests file processing:
- Text file detection
- File content reading
- Binary vs text file identification
- File size formatting
- Security validation

#### Concatenation Utilities (`src/utils/concatenationUtils.test.ts`)

Tests file concatenation:
- Header/footer generation
- Multiple format support (comment, markdown, custom)
- File statistics calculation
- Clipboard operations
- File download functionality

### Service Tests

#### GitHub Service (`src/services/githubService.test.ts`)

Tests GitHub API integration:
- Repository fetching
- File content retrieval
- Tree traversal
- Rate limit handling
- URL parsing
- Error handling

Key features tested:
- Authenticated vs unauthenticated requests
- Base64 content decoding
- Progress callbacks
- Text file filtering

### State Management Tests

#### Zustand Store (`src/stores/useAppStore.test.ts`)

Tests application state management:
- File operations (add, remove, clear)
- Pattern management
- Selection state
- UI state (processing, preview)
- Collection operations
- Settings updates

## Writing Tests

### Test File Naming

Test files follow the convention: `[filename].test.ts` or `[filename].test.tsx`

Example:
- Source: `src/utils/fileUtils.ts`
- Test: `src/utils/fileUtils.test.ts`

### Test Structure

Use descriptive `describe` and `it` blocks:

```typescript
describe('functionName', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking

#### File API Mocking

Mock browser File API for testing:

```typescript
const mockFile = new File(['content'], 'test.js', {
  type: 'text/javascript',
  lastModified: Date.now()
});

// Mock text() method
vi.spyOn(mockFile, 'text').mockResolvedValue('content');
```

#### Service Mocking

Mock external services:

```typescript
vi.mock('../services/collectionService', () => ({
  collectionService: {
    saveCollection: vi.fn().mockResolvedValue(1),
    getAllCollections: vi.fn().mockResolvedValue([])
  }
}));
```

#### Network Mocking

Mock fetch for API tests:

```typescript
const fetchMock = vi.fn();
global.fetch = fetchMock;

fetchMock.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' })
});
```

### Assertions

Use Vitest's expect API:

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();

// Numbers
expect(number).toBeGreaterThan(5);
expect(number).toBeLessThan(10);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(() => {
  // Reset state before each test
  useAppStore.setState(initialState);
});
```

### 2. Clear Test Names

Use descriptive test names that explain intent:

```typescript
// Good
it('should return true for files with .js extension')

// Bad
it('works')
```

### 3. Arrange-Act-Assert

Structure tests clearly:

```typescript
it('should calculate total size', () => {
  // Arrange
  const files = [
    { size: 100 },
    { size: 200 }
  ];

  // Act
  const total = calculateTotalSize(files);

  // Assert
  expect(total).toBe(300);
});
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
it('should handle empty array')
it('should handle invalid input')
it('should handle network errors')
it('should handle rate limits')
```

### 5. Mock External Dependencies

Don't rely on actual network requests or file system:

```typescript
// Mock fetch for GitHub API
global.fetch = vi.fn();

// Mock DOM APIs
Object.assign(navigator, {
  clipboard: { writeText: vi.fn() }
});
```

## Coverage Goals

Target coverage metrics:
- **Lines**: >80%
- **Functions**: >80%
- **Branches**: >70%
- **Statements**: >80%

View current coverage:

```bash
npm run test:coverage
```

## CI Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-push hooks (if configured with Husky)

## Debugging Tests

### Debug Single Test

```bash
npm test -- fileUtils
```

### Debug with Browser DevTools

```bash
npm run test:ui
```

Then use the browser's DevTools to inspect and debug.

### Verbose Output

```bash
npm test -- --reporter=verbose
```

## Common Issues

### Test Timeout

If tests timeout, increase the timeout:

```typescript
it('long running test', async () => {
  // test code
}, { timeout: 10000 }); // 10 seconds
```

### Mock Not Working

Ensure mocks are set up before imports:

```typescript
vi.mock('./module', () => ({
  // mock implementation
}));

// Then import
import { function } from './module';
```

### DOM Not Available

Some tests need DOM APIs. The setup file in `src/test/setup.ts` provides common mocks.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Coverage Guide](https://vitest.dev/guide/coverage.html)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm run test:run`
3. Check coverage: `npm run test:coverage`
4. Add tests for edge cases
5. Update this guide if adding new testing patterns
