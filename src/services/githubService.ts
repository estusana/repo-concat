import type { ProcessedFile } from '../types';

export interface GitHubRepository {
    owner: string;
    repo: string;
    branch?: string;
}

export interface GitHubFile {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
    content?: string;
    encoding?: string;
}

export interface GitHubTreeItem {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

export class GitHubService {
    private baseUrl = 'https://api.github.com';
    private token?: string;

    constructor(token?: string) {
        this.token = token;
    }

    setToken(token: string) {
        this.token = token;
    }

    private async makeRequest(url: string): Promise<any> {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'File-Concatenator/1.0'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 403) {
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                if (rateLimitRemaining === '0') {
                    throw new Error('GitHub API rate limit exceeded. Please provide a personal access token.');
                }
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getRepository(owner: string, repo: string): Promise<any> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}`;
        return this.makeRequest(url);
    }

    async getRepositoryContents(
        owner: string,
        repo: string,
        path: string = '',
        branch: string = 'main'
    ): Promise<GitHubFile[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        return this.makeRequest(url);
    }

    async getFileContent(
        owner: string,
        repo: string,
        path: string,
        branch: string = 'main'
    ): Promise<string> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const response = await this.makeRequest(url);

        if (response.content && response.encoding === 'base64') {
            return atob(response.content.replace(/\n/g, ''));
        }

        throw new Error('Unable to decode file content');
    }

    async getRepositoryTree(
        owner: string,
        repo: string,
        sha: string = 'HEAD',
        recursive: boolean = true
    ): Promise<GitHubTreeItem[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`;
        const response = await this.makeRequest(url);
        return response.tree || [];
    }

    async getAllFiles(
        owner: string,
        repo: string,
        branch: string = 'main',
        onProgress?: (current: number, total: number) => void
    ): Promise<ProcessedFile[]> {
        try {
            // Get repository info to get the default branch
            const repoInfo = await this.getRepository(owner, repo);
            const defaultBranch = branch === 'main' ? repoInfo.default_branch : branch;

            // Get the tree recursively
            const tree = await this.getRepositoryTree(owner, repo, defaultBranch, true);

            // Filter for files only (not directories)
            const fileItems = tree.filter(item => item.type === 'blob');

            const processedFiles: ProcessedFile[] = [];

            for (let i = 0; i < fileItems.length; i++) {
                const item = fileItems[i];

                if (onProgress) {
                    onProgress(i + 1, fileItems.length);
                }

                try {
                    // Check if it's likely a text file based on extension
                    if (this.isTextFile(item.path)) {
                        const content = await this.getFileContent(owner, repo, item.path, defaultBranch);

                        const processedFile: ProcessedFile = {
                            id: `github-${item.sha}`,
                            name: item.path.split('/').pop() || item.path,
                            path: item.path,
                            content,
                            size: item.size || content.length,
                            type: this.getFileType(item.path),
                            lastModified: new Date(), // GitHub API doesn't provide this easily
                            isTextFile: true
                        };

                        processedFiles.push(processedFile);
                    }
                } catch (error) {
                    console.warn(`Failed to process file ${item.path}:`, error);
                }
            }

            return processedFiles;
        } catch (error) {
            throw new Error(`Failed to fetch repository files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private isTextFile(path: string): boolean {
        const textExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.html', '.htm', '.css', '.scss', '.sass', '.less',
            '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
            '.md', '.txt', '.rst', '.tex',
            '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.sql', '.graphql', '.gql',
            '.dockerfile', '.gitignore', '.gitattributes',
            '.env', '.example', '.sample'
        ];

        const extension = path.toLowerCase().substring(path.lastIndexOf('.'));
        const filename = path.toLowerCase().split('/').pop() || '';

        return textExtensions.includes(extension) ||
            ['dockerfile', 'makefile', 'rakefile', 'gemfile', 'procfile'].includes(filename);
    }

    private getFileType(path: string): string {
        const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
        return extension || 'text';
    }

    parseRepositoryUrl(url: string): GitHubRepository | null {
        // Support various GitHub URL formats
        const patterns = [
            /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
            /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
            /^([^\/]+)\/([^\/]+)$/  // Simple owner/repo format
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2]
                };
            }
        }

        return null;
    }

    async validateRepository(owner: string, repo: string): Promise<boolean> {
        try {
            await this.getRepository(owner, repo);
            return true;
        } catch {
            return false;
        }
    }

    getRateLimitInfo(): Promise<any> {
        return this.makeRequest(`${this.baseUrl}/rate_limit`);
    }
}

export const githubService = new GitHubService();