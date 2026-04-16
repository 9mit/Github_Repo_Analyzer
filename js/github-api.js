/**
 * GitHub API Client - Proxied Version
 * Routes all requests through a server-side Netlify function to secure the PAT.
 */

const PROXY_URL = '/.netlify/functions/github-proxy';

/**
 * Build a URL for the proxy based on the target GitHub path and parameters.
 */
function buildProxyUrl(path, params = {}) {
    const url = new URL(PROXY_URL, window.location.origin);
    url.searchParams.set('path', path);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return url.toString();
}

/**
 * Handles common API errors.
 */
async function handleApiError(response, customMessage) {
    let message = '';
    try {
        const body = await response.json();
        message = body.message || body.error || '';
    } catch (e) {}

    // 401/403 now usually means the server-side PAT is invalid or missing
    if (response.status === 401 || response.status === 403) {
        throw new Error('GitHub API Authorization Error. Please ensure GITHUB_PAT is set in Netlify.');
    }

    if (response.status === 404) throw new Error('Resource not found.');
    throw new Error(`${customMessage}. ${message ? `Details: ${message}` : `Status: ${response.status}`}`);
}

/**
 * Extracts owner and repo names from a GitHub URL or "owner/repo" string.
 */
function extractRepoInfo(input) {
    if (!input) return null;
    input = input.trim();
    
    // Pattern for github.com/owner/repo
    const githubPattern = /github\.com\/([^/]+)\/([^/]+)/i;
    const match = input.match(githubPattern);
    
    if (match) {
        return {
            owner: match[1],
            repo: match[2].split('?')[0].split('#')[0].replace('.git', '')
        };
    }
    
    // Pattern for owner/repo
    const simplePattern = /^([^/]+)\/([^/]+)$/;
    const simpleMatch = input.match(simplePattern);
    if (simpleMatch) {
        return {
            owner: simpleMatch[1],
            repo: simpleMatch[2].replace('.git', '')
        };
    }
    
    return null;
}

/**
 * Extracts username from a GitHub profile URL or raw username string.
 */
function extractProfileInfo(input) {
    if (!input) return null;
    input = input.trim();
    if (input.includes('github.com')) {
        try {
            const url = new URL(input.startsWith('http') ? input : `https://${input}`);
            const parts = url.pathname.split('/').filter(p => p);
            return parts[0] || null;
        } catch (e) { return null; }
    }
    return input.includes(' ') ? null : input;
}

/**
 * Fetches all public repositories for a user.
 */
async function fetchUserRepositories(username) {
    const url = buildProxyUrl(`users/${username}/repos`, {
        per_page: 100,
        sort: 'updated'
    });
    const response = await fetch(url);
    if (!response.ok) await handleApiError(response, 'Could not fetch user repositories');
    return await response.json();
}

/**
 * Fetches the main data for a repository.
 */
async function fetchRepositoryData(owner, repo) {
    const url = buildProxyUrl(`repos/${owner}/${repo}`);
    const response = await fetch(url);
    if (!response.ok) await handleApiError(response, 'Could not fetch repository data');
    return await response.json();
}

/**
 * Fetches the file structure of a repository.
 */
async function fetchRepositoryStructure(owner, repo, branch) {
    const url = buildProxyUrl(`repos/${owner}/${repo}/git/trees/${branch}`, {
        recursive: 1
    });
    const response = await fetch(url);
    if (!response.ok) await handleApiError(response, 'Could not fetch repository structure');
    const data = await response.json();
    return data.tree;
}

/**
 * Fetches the content of a specific file.
 * Note: File content URLs from GitHub API often look like api.github.com/repos/.../contents/...
 * We need to extract the path portion for our proxy.
 */
async function fetchFileContent(apiUrl) {
    // apiUrl typical format: https://api.github.com/repos/owner/repo/contents/path
    const pathMatch = apiUrl.match(/api\.github\.com\/(.+)/);
    const apiPath = pathMatch ? pathMatch[1] : apiUrl;
    
    const url = buildProxyUrl(apiPath);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) await handleApiError(response, 'Could not fetch file content');
        const data = await response.json();
        if (!data.content) {
            return '// Binary file or content not available';
        }
        try {
            return atob(data.content);
        } catch (decodeError) {
            return '// Unable to decode file content (binary file)';
        }
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw error;
    }
}

/**
 * Fetches the repository's README content.
 */
async function fetchReadme(owner, repo) {
    try {
        const url = buildProxyUrl(`repos/${owner}/${repo}/readme`);
        const response = await fetch(url);
        if (!response.ok) return "No README found.";
        const data = await response.json();
        if (!data.content) return "No README content available.";
        try {
            return atob(data.content);
        } catch (e) {
            return "README content could not be decoded.";
        }
    } catch (error) {
        return "Error fetching README.";
    }
}

/**
 * Fetches the language breakdown for a repository.
 */
async function fetchLanguages(owner, repo) {
    const url = buildProxyUrl(`repos/${owner}/${repo}/languages`);
    const response = await fetch(url);
    if (!response.ok) await handleApiError(response, 'Could not fetch languages');
    return await response.json();
}
