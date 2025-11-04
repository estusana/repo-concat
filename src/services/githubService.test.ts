import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubService } from './githubService';

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new GitHubService();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor and setToken', () => {
    it('should create instance without token', () => {
      const service = new GitHubService();
      expect(service).toBeDefined();
    });

    it('should create instance with token', () => {
      const service = new GitHubService('test-token');
      expect(service).toBeDefined();
    });

    it('should allow setting token after creation', () => {
      const service = new GitHubService();
      service.setToken('new-token');
      // Token is private, but we can test it indirectly through API calls
      expect(service).toBeDefined();
    });
  });

  describe('makeRequest', () => {
    it('should make request with correct headers', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await service.getRepository('owner', 'repo');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'File-Concatenator/1.0'
          })
        })
      );
    });

    it('should include authorization header when token is set', async () => {
      const serviceWithToken = new GitHubService('test-token');
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await serviceWithToken.getRepository('owner', 'repo');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'token test-token'
          })
        })
      );
    });

    it('should throw error on rate limit exceeded', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: (key: string) => key === 'X-RateLimit-Remaining' ? '0' : null
        }
      });

      await expect(service.getRepository('owner', 'repo'))
        .rejects
        .toThrow('GitHub API rate limit exceeded');
    });

    it('should throw error on API error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null
        }
      });

      await expect(service.getRepository('owner', 'repo'))
        .rejects
        .toThrow('GitHub API error: 404 Not Found');
    });
  });

  describe('getRepository', () => {
    it('should fetch repository information', async () => {
      const mockRepo = { name: 'test-repo', default_branch: 'main' };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepo
      });

      const result = await service.getRepository('owner', 'repo');

      expect(result).toEqual(mockRepo);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo',
        expect.any(Object)
      );
    });
  });

  describe('getRepositoryContents', () => {
    it('should fetch repository contents', async () => {
      const mockContents = [{ name: 'file1.js' }, { name: 'file2.js' }];
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockContents
      });

      const result = await service.getRepositoryContents('owner', 'repo', '', 'main');

      expect(result).toEqual(mockContents);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/?ref=main',
        expect.any(Object)
      );
    });

    it('should fetch contents from specific path', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => []
      });

      await service.getRepositoryContents('owner', 'repo', 'src/utils', 'develop');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/contents/src/utils?ref=develop',
        expect.any(Object)
      );
    });
  });

  describe('getFileContent', () => {
    it('should fetch and decode file content', async () => {
      const content = 'console.log("hello");';
      const encodedContent = btoa(content);

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: encodedContent,
          encoding: 'base64'
        })
      });

      const result = await service.getFileContent('owner', 'repo', 'file.js', 'main');

      expect(result).toBe(content);
    });

    it('should handle content with newlines', async () => {
      const content = 'line1\nline2\nline3';
      const encodedContent = btoa(content).replace(/(.{76})/g, '$1\n');

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: encodedContent,
          encoding: 'base64'
        })
      });

      const result = await service.getFileContent('owner', 'repo', 'file.js');

      expect(result).toBe(content);
    });

    it('should throw error when content cannot be decoded', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: null,
          encoding: 'base64'
        })
      });

      await expect(service.getFileContent('owner', 'repo', 'file.js'))
        .rejects
        .toThrow('Unable to decode file content');
    });
  });

  describe('getRepositoryTree', () => {
    it('should fetch repository tree', async () => {
      const mockTree = [
        { path: 'file1.js', type: 'blob' as const },
        { path: 'dir', type: 'tree' as const }
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ tree: mockTree })
      });

      const result = await service.getRepositoryTree('owner', 'repo', 'HEAD', true);

      expect(result).toEqual(mockTree);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/HEAD?recursive=1',
        expect.any(Object)
      );
    });

    it('should fetch non-recursive tree', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ tree: [] })
      });

      await service.getRepositoryTree('owner', 'repo', 'main', false);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/main',
        expect.any(Object)
      );
    });

    it('should return empty array when tree is missing', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      const result = await service.getRepositoryTree('owner', 'repo');

      expect(result).toEqual([]);
    });
  });

  describe('getAllFiles', () => {
    it('should fetch all text files from repository', async () => {
      const mockRepo = { default_branch: 'main' };
      const mockTree = [
        { path: 'file1.js', type: 'blob' as const, sha: 'sha1', size: 100 },
        { path: 'file2.txt', type: 'blob' as const, sha: 'sha2', size: 200 },
        { path: 'image.png', type: 'blob' as const, sha: 'sha3', size: 1000 }
      ];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepo
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tree: mockTree })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('console.log();'), encoding: 'base64' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('text content'), encoding: 'base64' })
        });

      const result = await service.getAllFiles('owner', 'repo', 'main');

      expect(result).toHaveLength(2); // Only .js and .txt files
      expect(result[0].path).toBe('file1.js');
      expect(result[1].path).toBe('file2.txt');
    });

    it('should call progress callback', async () => {
      const mockRepo = { default_branch: 'main' };
      const mockTree = [
        { path: 'file1.js', type: 'blob' as const, sha: 'sha1', size: 100 }
      ];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepo
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tree: mockTree })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('code'), encoding: 'base64' })
        });

      const progressMock = vi.fn();
      await service.getAllFiles('owner', 'repo', 'main', progressMock);

      expect(progressMock).toHaveBeenCalledWith(1, 1);
    });

    it('should use default branch when branch is main', async () => {
      const mockRepo = { default_branch: 'master' };
      const mockTree: any[] = [];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepo
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tree: mockTree })
        });

      await service.getAllFiles('owner', 'repo', 'main');

      // Should use 'master' from default_branch
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/master?recursive=1',
        expect.any(Object)
      );
    });

    it('should skip non-text files', async () => {
      const mockRepo = { default_branch: 'main' };
      const mockTree = [
        { path: 'file.exe', type: 'blob' as const, sha: 'sha1', size: 100 },
        { path: 'image.jpg', type: 'blob' as const, sha: 'sha2', size: 200 }
      ];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepo
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tree: mockTree })
        });

      const result = await service.getAllFiles('owner', 'repo', 'main');

      expect(result).toHaveLength(0);
    });

    it('should continue on file fetch error', async () => {
      const mockRepo = { default_branch: 'main' };
      const mockTree = [
        { path: 'file1.js', type: 'blob' as const, sha: 'sha1', size: 100 },
        { path: 'file2.js', type: 'blob' as const, sha: 'sha2', size: 200 }
      ];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepo
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tree: mockTree })
        })
        .mockRejectedValueOnce(new Error('File fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('code2'), encoding: 'base64' })
        });

      const result = await service.getAllFiles('owner', 'repo', 'main');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('file2.js');
    });

    it('should throw error on repository fetch failure', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(service.getAllFiles('owner', 'repo', 'main'))
        .rejects
        .toThrow('Failed to fetch repository files');
    });
  });

  describe('isTextFile', () => {
    it('should identify common text file extensions', () => {
      // These are tested indirectly through getAllFiles
      expect(service['isTextFile']('file.js')).toBe(true);
      expect(service['isTextFile']('file.ts')).toBe(true);
      expect(service['isTextFile']('file.py')).toBe(true);
      expect(service['isTextFile']('file.md')).toBe(true);
      expect(service['isTextFile']('file.json')).toBe(true);
    });

    it('should identify special filenames', () => {
      expect(service['isTextFile']('Dockerfile')).toBe(true);
      expect(service['isTextFile']('Makefile')).toBe(true);
      expect(service['isTextFile']('Gemfile')).toBe(true);
    });

    it('should reject binary file extensions', () => {
      expect(service['isTextFile']('image.png')).toBe(false);
      expect(service['isTextFile']('video.mp4')).toBe(false);
      expect(service['isTextFile']('archive.zip')).toBe(false);
    });
  });

  describe('parseRepositoryUrl', () => {
    it('should parse HTTPS GitHub URL', () => {
      const result = service.parseRepositoryUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse HTTPS URL with .git suffix', () => {
      const result = service.parseRepositoryUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse HTTPS URL with additional path', () => {
      const result = service.parseRepositoryUrl('https://github.com/owner/repo/tree/main');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH GitHub URL', () => {
      const result = service.parseRepositoryUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse simple owner/repo format', () => {
      const result = service.parseRepositoryUrl('owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for invalid URLs', () => {
      expect(service.parseRepositoryUrl('not-a-url')).toBeNull();
      expect(service.parseRepositoryUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(service.parseRepositoryUrl('')).toBeNull();
    });
  });

  describe('validateRepository', () => {
    it('should return true for valid repository', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'repo' })
      });

      const result = await service.validateRepository('owner', 'repo');

      expect(result).toBe(true);
    });

    it('should return false for invalid repository', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null }
      });

      const result = await service.validateRepository('owner', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await service.validateRepository('owner', 'repo');

      expect(result).toBe(false);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should fetch rate limit information', async () => {
      const mockRateLimit = {
        rate: {
          limit: 5000,
          remaining: 4999,
          reset: 1234567890
        }
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRateLimit
      });

      const result = await service.getRateLimitInfo();

      expect(result).toEqual(mockRateLimit);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/rate_limit',
        expect.any(Object)
      );
    });
  });

  describe('getFileType', () => {
    it('should extract file type from path', () => {
      expect(service['getFileType']('file.js')).toBe('js');
      expect(service['getFileType']('file.txt')).toBe('txt');
      expect(service['getFileType']('path/to/file.ts')).toBe('ts');
    });

    it('should return filename for files without extension', () => {
      // getFileType returns the part after the last dot, lowercased
      // For files without dots, it returns the entire filename lowercased
      expect(service['getFileType']('README')).toBe('readme');
      expect(service['getFileType']('Dockerfile')).toBe('dockerfile');
    });

    it('should be case insensitive', () => {
      expect(service['getFileType']('FILE.JS')).toBe('js');
      expect(service['getFileType']('FILE.TXT')).toBe('txt');
    });
  });
});
