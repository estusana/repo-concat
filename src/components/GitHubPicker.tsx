import React, { useState } from 'react';
import {
    CodeBracketIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { githubService } from '../services/githubService';

export const GitHubPicker: React.FC = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [token, setToken] = useState('');
    const [branch, setBranch] = useState('main');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string>();
    const [showTokenInput, setShowTokenInput] = useState(false);

    const { addFiles } = useAppStore();

    const handleFetchRepository = async () => {
        if (!repoUrl.trim()) {
            setError('Please enter a repository URL');
            return;
        }

        const parsedRepo = githubService.parseRepositoryUrl(repoUrl.trim());
        if (!parsedRepo) {
            setError('Invalid repository URL format');
            return;
        }

        setIsLoading(true);
        setError(undefined);
        setProgress({ current: 0, total: 0 });

        try {
            // Set token if provided
            if (token.trim()) {
                githubService.setToken(token.trim());
            }

            // Validate repository exists
            const isValid = await githubService.validateRepository(parsedRepo.owner, parsedRepo.repo);
            if (!isValid) {
                throw new Error('Repository not found or not accessible');
            }

            // Fetch all files
            const files = await githubService.getAllFiles(
                parsedRepo.owner,
                parsedRepo.repo,
                branch || 'main',
                (current, total) => setProgress({ current, total })
            );

            if (files.length === 0) {
                setError('No text files found in repository');
                return;
            }

            // Add files to store
            addFiles(files);

        } catch (err: any) {
            setError(err.message || 'Failed to fetch repository');
        } finally {
            setIsLoading(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleUrlChange = (value: string) => {
        setRepoUrl(value);
        if (error) setError(undefined);
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                    <CodeBracketIcon className="h-12 w-12 text-gray-400" />
                </div>

                <div className="space-y-4">
                    {/* Repository URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repository URL
                        </label>
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://github.com/owner/repo or owner/repo"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            disabled={isLoading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Supports: github.com/owner/repo, git@github.com:owner/repo.git, or owner/repo
                        </p>
                    </div>

                    {/* Branch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Branch (optional)
                        </label>
                        <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="main"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Token section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Personal Access Token (optional)
                            </label>
                            <button
                                onClick={() => setShowTokenInput(!showTokenInput)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                {showTokenInput ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showTokenInput && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                        className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Required for private repositories or to avoid rate limits.
                                    <a
                                        href="https://github.com/settings/tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 ml-1"
                                    >
                                        Create token
                                    </a>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Progress */}
                    {isLoading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Fetching repository files...</span>
                                {progress.total > 0 && (
                                    <span>{progress.current} / {progress.total}</span>
                                )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: progress.total > 0
                                            ? `${(progress.current / progress.total) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Fetch button */}
                    <button
                        onClick={handleFetchRepository}
                        disabled={isLoading || !repoUrl.trim()}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Fetching Repository...
                            </>
                        ) : (
                            <>
                                <CodeBracketIcon className="h-4 w-4 mr-2" />
                                Fetch Repository
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info section */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">GitHub Integration Features:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Fetches all text files from any public repository</li>
                            <li>• Supports private repositories with personal access token</li>
                            <li>• Automatically filters binary files</li>
                            <li>• Preserves directory structure in file paths</li>
                            <li>• Rate limit: 60 requests/hour (5000 with token)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};