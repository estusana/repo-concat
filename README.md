# File Concatenator

A modern web-based tool for concatenating files with intelligent filtering and pattern matching.

## Overview

This project started as a replacement for bash-based file concatenation scripts, evolving into a full-featured React application that runs entirely in the browser.

## Features

- **Drag & Drop File Upload**: Easy file selection with visual feedback
- **Smart Text Detection**: Automatically identifies text files vs binary files
- **Exclude Patterns**: Flexible filtering with support for extensions, globs, and regex
- **Browser Storage**: Persistent collections using IndexedDB
- **Copy to Clipboard**: One-click copying of concatenated results
- **Export Options**: Multiple output formats and download options

## Legacy Scripts

The original bash scripts that inspired this project can be found in the `legacy-scripts/` directory:

- `github-concatenator.sh` - Downloads and concatenates files from GitHub repositories
- `local-folder-concatenator.sh` - Processes local directories and files

## Development

This project uses modern web technologies:

- **React 18** with TypeScript for the UI
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Dexie.js** for IndexedDB storage
- **Zustand** for state management

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Status

🚧 **In Development** - This project is actively being developed with regular updates.

## License

MIT License - see LICENSE file for details.

---

_Started: August 2024_
