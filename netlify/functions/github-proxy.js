// Netlify Function: GitHub API Proxy
// This function securely proxies requests to the GitHub API using a server-side PAT

// CORS headers shared across responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    // Only allow GET and POST requests
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }

    // Get API key from environment variable
    const token = process.env.GITHUB_PAT;

    if (!token) {
        console.error('GITHUB_PAT is missing in Netlify environment variables');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GitHub API token not configured on server.' }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }

    try {
        // The path to hit on GitHub is passed as a query param 'path'
        const targetPath = event.queryStringParameters?.path;
        
        if (!targetPath) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Path parameter is required' }),
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        // Sanitize path: only allow valid GitHub API paths
        const allowedPrefixes = ['repos/', 'users/', 'orgs/', 'search/'];
        const isAllowed = allowedPrefixes.some(prefix => targetPath.startsWith(prefix));
        if (!isAllowed) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid API path' }),
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        // Reconstruct the full GitHub URL with all other query parameters
        const queryParams = { ...event.queryStringParameters };
        delete queryParams.path; // Don't send 'path' to GitHub
        
        const queryString = Object.keys(queryParams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
            .join('&');

        const githubUrl = `https://api.github.com/${targetPath}${queryString ? '?' + queryString : ''}`;

        // Forward request to GitHub
        const githubResponse = await fetch(githubUrl, {
            method: event.httpMethod,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${token}`,
                'User-Agent': 'CodeBuddy-Analyzer'
            }
        });

        if (!githubResponse.ok) {
            const errorText = await githubResponse.text();
            return {
                statusCode: githubResponse.status,
                body: errorText,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        const data = await githubResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60',
                ...CORS_HEADERS
            }
        };

    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }
};
