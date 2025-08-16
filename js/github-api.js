/**
 * Extracts owner and repo name from a GitHub URL.
 * @param {string} url - The GitHub repository URL.
 * @returns {object|null} - An object with {owner, repo} or null if invalid.
 */
function extractRepoInfo(url) {
    try {
        const path = new URL(url).pathname;
        const parts = path.split('/').filter(p => p);
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Fetches the main data for a repository.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @returns {Promise<object>} - The repository data.
 */
async function fetchRepositoryData(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) throw new Error(`Could not fetch repository data. Status: ${response.status}`);
    return await response.json();
}

/**
 * Fetches the file structure of a repository.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The default branch name.
 * @returns {Promise<object>} - The repository file tree.
 */
async function fetchRepositoryStructure(owner, repo, branch) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!response.ok) throw new Error(`Could not fetch repository structure. Status: ${response.status}`);
    const data = await response.json();
    return data.tree;
}

/**
 * Fetches the content of a specific file.
 * @param {string} url - The URL to the file content API.
 * @returns {Promise<string>} - The decoded file content.
 */
async function fetchFileContent(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not fetch file content. Status: ${response.status}`);
    const data = await response.json();
    return atob(data.content); // Decode from base64
}

/**
 * Fetches the repository's README content.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @returns {Promise<string>} - The decoded README content.
 */
async function fetchReadme(owner, repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
        if (!response.ok) return "No README found.";
        const data = await response.json();
        return atob(data.content);
    } catch (error) {
        return "Error fetching README.";
    }
}

/**
 * Fetches the language breakdown for a repository.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @returns {Promise<object>} - An object with languages and their byte counts.
 */
async function fetchLanguages(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (!response.ok) throw new Error(`Could not fetch languages. Status: ${response.status}`);
    return await response.json();
}