/**
 * Performance utilities for file processing optimization
 */

export interface PerformanceMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    filesProcessed: number;
    bytesProcessed: number;
    memoryUsage?: number;
}

export class PerformanceMonitor {
    private metrics: PerformanceMetrics;

    constructor() {
        this.metrics = {
            startTime: performance.now(),
            filesProcessed: 0,
            bytesProcessed: 0
        };
    }

    recordFileProcessed(fileSize: number) {
        this.metrics.filesProcessed++;
        this.metrics.bytesProcessed += fileSize;
    }

    finish(): PerformanceMetrics {
        this.metrics.endTime = performance.now();
        this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

        // Get memory usage if available
        if ('memory' in performance) {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }

        return { ...this.metrics };
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }
}

/**
 * Debounce function to limit rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Process files in batches to avoid blocking the UI
 */
export async function processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);

        if (onProgress) {
            onProgress(Math.min(i + batchSize, items.length), items.length);
        }

        // Yield control to the browser
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results;
}

/**
 * Memory-efficient file reader for large files
 */
export function readFileInChunks(
    file: File,
    chunkSize: number = 1024 * 1024, // 1MB chunks
    onChunk?: (chunk: string, progress: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let content = '';
        let offset = 0;

        const readNextChunk = () => {
            if (offset >= file.size) {
                resolve(content);
                return;
            }

            const slice = file.slice(offset, offset + chunkSize);
            reader.readAsText(slice);
        };

        reader.onload = (e) => {
            const chunk = e.target?.result as string;
            content += chunk;
            offset += chunkSize;

            if (onChunk) {
                const progress = Math.min(offset / file.size, 1);
                onChunk(chunk, progress);
            }

            readNextChunk();
        };

        reader.onerror = () => reject(reader.error);
        readNextChunk();
    });
}

/**
 * Estimate processing time based on file size and count
 */
export function estimateProcessingTime(
    fileCount: number,
    totalSize: number
): number {
    // Base time per file (ms) + time per byte
    const baseTimePerFile = 50; // 50ms base processing time
    const timePerByte = 0.001; // 1ms per KB

    return (fileCount * baseTimePerFile) + (totalSize * timePerByte);
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(metrics: PerformanceMetrics): string {
    const duration = metrics.duration || 0;
    const filesPerSecond = metrics.filesProcessed / (duration / 1000);
    const mbPerSecond = (metrics.bytesProcessed / (1024 * 1024)) / (duration / 1000);

    return `Processed ${metrics.filesProcessed} files (${(metrics.bytesProcessed / (1024 * 1024)).toFixed(2)} MB) in ${duration.toFixed(0)}ms
Rate: ${filesPerSecond.toFixed(1)} files/sec, ${mbPerSecond.toFixed(2)} MB/sec`;
}

/**
 * Check if the browser supports modern features
 */
export function getBrowserCapabilities() {
    return {
        fileSystemAccess: 'showDirectoryPicker' in window,
        webWorkers: typeof Worker !== 'undefined',
        indexedDB: 'indexedDB' in window,
        clipboard: 'clipboard' in navigator,
        performanceObserver: 'PerformanceObserver' in window,
        memoryAPI: 'memory' in performance
    };
}