// Netlify Function: Groq AI Chat Proxy (V1 Handler)
// This function securely proxies requests to Groq API using a server-side API key

// CORS headers shared across responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }

    // Get API key from environment variable
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.error('GROQ_API_KEY is missing');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured' }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }

    try {
        // Validate body size (prevent abuse)
        if (event.body && event.body.length > 50000) {
            return {
                statusCode: 413,
                body: JSON.stringify({ error: 'Request body too large' }),
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        const body = JSON.parse(event.body);
        const { messages, model, max_tokens, temperature } = body;

        // Validate required fields
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Messages array is required and must not be empty' }),
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        // Call Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'llama-3.1-8b-instant',
                messages: messages,
                max_tokens: Math.min(max_tokens || 1024, 2048),
                temperature: temperature || 0.7
            })
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('Groq API error:', groqResponse.status, errorText);
            return {
                statusCode: groqResponse.status,
                body: JSON.stringify({ error: 'AI service error', details: errorText }),
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            };
        }

        const data = await groqResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS
            }
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        };
    }
};
