# File Concatenator

A modern, browser-based tool for combining multiple files with intelligent filtering and export options. Built with React, TypeScript, and modern web APIs.

## ✨ Features

### 📁 Multiple Input Sources

- **File Upload**: Drag-and-drop or browse individual files
- **Directory Selection**: Use File System Access API to process entire folders
- **GitHub Integration**: Fetch files directly from any GitHub repository

### 🎯 Smart Filtering

- **Pattern Types**: Extension, glob, regex, and path-based exclusions
- **Visual Pattern Builder**: Interactive tool for creating complex filter rules
- **Pattern Presets**: Common exclusion patterns for different project types
- **Real-time Testing**: Preview which files match your patterns

### 📊 Advanced Export Options

- **Multiple Formats**: Plain text, Markdown, JSON, HTML, and XML
- **Custom Templates**: Advanced users can create custom export formats
- **Metadata Inclusion**: Optional file statistics and processing information
- **Export Preview**: See exactly what will be exported before downloading

### 🌳 File Organization

- **List View**: Traditional file listing with sorting and filtering
- **Tree View**: Hierarchical folder structure visualization
- **Collection Management**: Save and load file collections with settings
- **Persistent Storage**: Browser-based storage using IndexedDB

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Modern browser (Chrome 86+, Firefox 90+, Safari 14+)

### Installation

```bash
# Clone the repository
git clone https://github.com/estusana/repo-concat.git
cd repo-concat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## 📖 Usage Guide

### Basic File Concatenation

1. **Upload Files**:

   - Drag and drop files onto the upload area
   - Or click "Browse" to select files manually
   - Only text files will be processed automatically

2. **Set Exclude Patterns**:

   - Add patterns to filter out unwanted files
   - Use extensions (`.log`), globs (`*.test.js`), or regex patterns
   - Try the visual pattern builder for complex rules

3. **Export Results**:
   - Use "Quick Download" for simple text output
   - Or "Export Options" for advanced formats and customization

### Directory Processing

1. Switch to the "Select Directory" tab
2. Click "Select Directory" (requires Chrome 86+ or Edge 86+)
3. Choose a folder - all files will be processed recursively
4. Apply exclude patterns to filter results

### GitHub Integration

1. Switch to the "GitHub Repository" tab
2. Enter a repository URL (e.g., `owner/repo` or full GitHub URL)
3. Optionally specify a branch (defaults to main/master)
4. For private repos or higher rate limits, add a Personal Access Token
5. Click "Fetch Repository" to download all text files

## 🔧 Configuration

### Pattern Types

- **Extension**: Match by file extension (e.g., `js`, `css`, `log`)
- **Glob**: Use wildcards (e.g., `*.test.js`, `node_modules/*`)
- **Regex**: Advanced pattern matching (e.g., `\.(test|spec)\.`)
- **Path**: Match files containing text in their path

### Export Formats

- **Plain Text**: Simple concatenation with headers
- **Markdown**: Formatted with code blocks and metadata
- **JSON**: Structured data with file information
- **HTML**: Interactive report with syntax highlighting
- **XML**: Structured XML format with metadata

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **Storage**: Dexie.js (IndexedDB wrapper)
- **APIs**: File System Access API, GitHub REST API

### Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx   # Multi-source file input
│   ├── ExcludePatterns.tsx # Pattern management
│   ├── PatternBuilder.tsx  # Visual pattern builder
│   ├── FileTree.tsx     # Hierarchical file view
│   ├── ExportOptions.tsx   # Advanced export interface
│   └── ...
├── services/            # Business logic
│   ├── githubService.ts # GitHub API integration
│   ├── database.ts      # IndexedDB setup
│   └── ...
├── utils/               # Utility functions
│   ├── patternUtils.ts  # Pattern matching logic
│   ├── fileUtils.ts     # File processing
│   └── ...
└── stores/              # State management
    └── useAppStore.ts   # Main application state
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web standards and APIs
- Inspired by command-line file concatenation tools
- Uses GitHub's REST API for repository access
- Leverages browser storage for offline functionality
