/**
 * AI Engine - Groq LLM Integration for CodeBuddy
 * Uses Netlify serverless function for secure API access
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_CONFIG = {
    // Serverless function endpoint (uses server-side API key)
    functionUrl: '/.netlify/functions/chat',

    // Model settings
    model: 'llama-3.1-8b-instant',
    maxTokens: 1024,
    temperature: 0.7,

    // Fallback to rule-based if API fails
    useFallback: true
};

// ============================================================================
// LLM API INTEGRATION
// ============================================================================

/**
 * Generate AI response using serverless function
 */
async function generateAIResponse(userMessage, repoContext) {
    // Build context about the repository
    const systemPrompt = buildSystemPrompt(repoContext);

    try {
        const response = await fetch(AI_CONFIG.functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature
            })
        });

        if (!response.ok) {
            console.error(`AI function error: ${response.status} ${response.statusText}`);
            console.error('Check if the function is deployed and GROQ_API_KEY is set in Netlify.');
            return null; // Fall back to rule-based
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;

    } catch (error) {
        console.error('AI request failed:', error);
        console.error('Check network connection and if Netlify functions are accessible.');
        return null; // Fall back to rule-based
    }
}

/**
 * Generate AI profile ranking using serverless function
 */
async function generateProfileRanking(username, topRepositories) {
    const systemPrompt = `You are a Principal Software Engineer with 25 years of experience in system design and architecture. 
You are blunt, professional, and highlight exactly what makes a project technically impressive or practically useful.
The user has provided a filtered list of the top 5 GitHub repositories for the user "@${username}".
Your task: Evaluate and rank these projects. 
For each project, provide:
1. The rank (1 to 5).
2. The Repository Name.
3. A concise (2-3 sentence) explanation of why it's highly ranked, focusing on its technical stack, utility, or signals of quality (like stars, deployment, or documentation).

Use clean markdown formatting. Keep the tone experienced, authoritative, and direct.`;

    const userDataText = topRepositories.map(r => 
        `- Name: ${r.name}\n  Desc: ${r.description || 'N/A'}\n  Lang: ${r.language || 'N/A'}\n  Stars: ${r.stargazers_count}\n  Updated: ${r.updated_at}\n  URL: ${r.html_url}\n  Deployment: ${r.homepage || 'N/A'}`
    ).join('\n\n');

    try {
        const response = await fetch(AI_CONFIG.functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: "Here are the top repositories:\n\n" + userDataText }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            console.error(`AI function error: ${response.status} ${response.statusText}`);
            return null; 
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;

    } catch (error) {
        console.error('AI request failed:', error);
        return null; 
    }
}


/**
 * Build system prompt with repository context
 */
function buildSystemPrompt(repoContext) {
    const { repoData, structure, languages } = repoContext;

    // Get key files list
    const keyFiles = structure
        .filter(f => f.type === 'blob')
        .slice(0, 50)
        .map(f => f.path)
        .join('\n');

    // Get language breakdown
    const langList = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang, bytes]) => `${lang}: ${Math.round(bytes / 1024)}KB`)
        .join(', ');

    return `You are CodeBuddy, an AI assistant that helps developers understand GitHub repositories.

REPOSITORY CONTEXT:
- Name: ${repoData.name}
- Owner: ${repoData.owner.login}
- Description: ${repoData.description || 'No description'}
- Stars: ${repoData.stargazers_count}
- Forks: ${repoData.forks_count}
- Primary Language: ${repoData.language || 'Unknown'}
- Languages: ${langList}
- License: ${repoData.license?.name || 'Not specified'}

KEY FILES:
${keyFiles}

INSTRUCTIONS:
1. Answer questions about this specific repository
2. Be concise but helpful
3. Use markdown formatting for code and lists
4. If unsure, say so rather than making things up
5. For code questions, reference specific files when possible
6. Keep responses under 500 words`;
}

/**
 * Check if AI is available (always true with serverless function)
 */
function hasGroqApiKey() {
    return true; // Server-side key is always available
}

// ============================================================================
// STYLES (kept for any remaining UI elements)
// ============================================================================

const aiEngineStyles = document.createElement('style');
aiEngineStyles.textContent = `
    /* AI indicator in chat */
    .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.7rem;
        padding: 2px 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 12px;
        color: white;
        margin-left: 8px;
    }

    .ai-settings-btn {
        background: none;
        border: none;
        color: var(--text-muted, #64748b);
        cursor: pointer;
        padding: 4px 8px;
        font-size: 0.85rem;
        transition: color 0.2s;
    }

    .ai-settings-btn:hover {
        color: var(--primary-color, #6366f1);
    }
`;
document.head.appendChild(aiEngineStyles);

// ============================================================================
// EXPORT
// ============================================================================

// Make functions available globally
window.AIEngine = {
    generateAIResponse,
    generateProfileRanking,
    hasGroqApiKey
};

