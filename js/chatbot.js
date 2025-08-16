// --- "Smarter" Chatbot for Your CodeBuddy ---

// --- Context and Caching ---
let chatbotRepoData = null;
let chatbotRepoStructure = null;
let chatbotLanguages = null;
const fileContentCache = new Map(); // Cache for fetched file content to improve performance

/**
 * Initializes the chatbot with repository context.
 * @param {object} repoData - Main repository data.
 * @param {Array<object>} structure - Flat file structure list.
 * @param {object} languages - Language breakdown.
 */
function initChatbot(repoData, structure, languages) {
    chatbotRepoData = repoData;
    chatbotRepoStructure = structure;
    chatbotLanguages = languages;
    fileContentCache.clear(); // Clear cache for new repository
}

// --- User Interaction ---

/**
 * Handles sending a message from the user.
 */
async function sendChatMessage() {
    const userInput = document.getElementById('user-message');
    const message = userInput.value.trim();
    if (message === '') return;

    addMessageToChat('user', message);
    userInput.value = '';
    
    addMessageToChat('bot', '<div class="typing-indicator"><span></span><span></span><span></span></div>', true);

    const response = await generateChatbotResponse(message);

    // Wait a bit to simulate "thinking" and then replace the typing indicator
    setTimeout(() => {
        updateLastBotMessage(response);
    }, 750);
}

/**
 * Adds a message to the chat UI.
 * @param {string} sender - 'user' or 'bot'.
 * @param {string} html - The message content (can be HTML).
 * @param {boolean} isTyping - If true, adds a class for the typing indicator.
 */
function addMessageToChat(sender, html, isTyping = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    if (isTyping) {
        messageDiv.classList.add('typing');
    }
    messageDiv.innerHTML = `<div class="message-content">${html}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Updates the last bot message, typically to replace a typing indicator.
 * @param {string} html - The new HTML content for the message.
 */
function updateLastBotMessage(html) {
    const typingMessage = document.querySelector('.chat-message.bot.typing');
    if (typingMessage) {
        typingMessage.querySelector('.message-content').innerHTML = html;
        typingMessage.classList.remove('typing');
    }
}


// --- Intent Recognition and Response Generation ---

// Define intents with regex patterns and corresponding handler functions
const intents = [
    {
        name: 'greet',
        patterns: [/^h(i|ello)$/i],
        handler: () => `Hello! How can I help you with the **${chatbotRepoData.name}** repository?`
    },
    {
        name: 'about',
        patterns: [/^(what is this|about|describe|purpose)/i],
        handler: () => `This is the **${chatbotRepoData.name}** repository. The description says: "${chatbotRepoData.description || 'No description provided.'}"`
    },
    {
        name: 'find_file',
        patterns: [/(find|show me|where is|open|get) (the )?([\w\.\-\/]+)/i],
        handler: handleFindFile
    },
    {
        name: 'list_dependencies',
        patterns: [/(dependencies|packages|libraries|libs)/i],
        handler: handleListDependencies
    },
    {
        name: 'explain_code',
        patterns: [/(what does|explain|how does) [`']?(\w+)[`']? (function|method|do)/i],
        handler: handleExplainCode
    },
    {
        name: 'get_metadata',
        patterns: [/(owner|author|stars|forks|license)/i],
        handler: handleGetMetadata
    },
    {
        name: 'help',
        patterns: [/^help$/i, /what can you do/i],
        handler: () => `I can help you understand this repository. Try asking me things like:
        <ul>
            <li>"What is this project about?"</li>
            <li>"Show me the package.json file"</li>
            <li>"What are the dependencies?"</li>
            <li>"What does the 'handleAnalysis' function do?"</li>
            <li>"Who is the owner?"</li>
        </ul>`
    }
];

/**
 * Generates a response by matching the user's message to an intent.
 * @param {string} message - The user's message.
 * @returns {Promise<string>} - The bot's response as an HTML string.
 */
async function generateChatbotResponse(message) {
    if (!chatbotRepoData) {
        return "Please analyze a repository first.";
    }

    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            const match = message.match(pattern);
            if (match) {
                // Await the handler in case it's async (e.g., needs to fetch a file)
                return await intent.handler(match, message);
            }
        }
    }

    return "I'm not sure how to answer that. Try asking 'help' to see what I can do.";
}


// --- Intent Handlers ---

function handleGetMetadata(match, message) {
    const keyword = message.toLowerCase();
    if (keyword.includes('owner') || keyword.includes('author')) {
        return `The owner of this repository is **${chatbotRepoData.owner.login}**.`;
    }
    if (keyword.includes('stars')) {
        return `It has **${chatbotRepoData.stargazers_count}** stars.`;
    }
    if (keyword.includes('forks')) {
        return `It has **${chatbotRepoData.forks_count}** forks.`;
    }
    if (keyword.includes('license')) {
        return `The repository is under the **${chatbotRepoData.license ? chatbotRepoData.license.name : 'N/A'}** license.`;
    }
    return "I couldn't find that specific piece of information.";
}

function handleFindFile(match) {
    const fileName = match[3];
    const file = findFileInStructure(fileName);

    if (file) {
        return `I found the file \`${file.path}\`.<br><button class="chat-action-btn" data-action="view-file" data-url="${file.url}" data-path="${file.path}">Click here to view it</button>`;
    } else {
        return `Sorry, I couldn't find a file named \`${fileName}\`.`;
    }
}

async function handleListDependencies() {
    const packageJson = findFileInStructure('package.json');
    if (packageJson) {
        try {
            const content = await getFileContent(packageJson.url);
            const data = JSON.parse(content);
            const dependencies = { ...data.dependencies, ...data.devDependencies };
            if (Object.keys(dependencies).length > 0) {
                let response = 'Here are the dependencies from `package.json`:<ul class="chat-list">';
                for (const [name, version] of Object.entries(dependencies)) {
                    response += `<li><strong>${name}</strong>: ${version}</li>`;
                }
                response += '</ul>';
                return response;
            } else {
                return '`package.json` was found, but it lists no dependencies.';
            }
        } catch (error) {
            return 'I found a `package.json`, but I had trouble reading it.';
        }
    }
    return "I couldn't find a `package.json` file to check for dependencies.";
}

async function handleExplainCode(match) {
    const functionName = match[2];
    // Prioritize searching in JS files
    const relevantFiles = chatbotRepoStructure.filter(file => file.path.endsWith('.js'));

    for (const file of relevantFiles) {
        const content = await getFileContent(file.url);
        const functionRegex = new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=\\s*\\(.*\\)\\s*=>|let\\s+${functionName}\\s*=\\s*\\(.*\\)\\s*=>)`, 's');
        
        if (functionRegex.test(content)) {
            // Simple extraction: find the function and grab the next ~15 lines for context
            const lines = content.split('\n');
            const startLine = lines.findIndex(line => line.match(functionRegex));
            if (startLine !== -1) {
                const codeSnippet = lines.slice(startLine, startLine + 15).join('\n');
                const highlightedCode = hljs.highlightAuto(codeSnippet).value;

                return `I found a function named \`${functionName}\` in \`${file.path}\`. Here's a snippet:
                <pre><code class="hljs">${highlightedCode}</code></pre>
                <button class="chat-action-btn" data-action="view-file" data-url="${file.url}" data-path="${file.path}">View the full file</button>`;
            }
        }
    }
    return `I couldn't find a function named \`${functionName}\` in any of the JavaScript files.`;
}


// --- Helper Functions ---

/**
 * Finds a file in the repository structure by its name.
 * @param {string} fileName - The name of the file to find (e.g., 'package.json').
 * @returns {object|null} The file object or null if not found.
 */
function findFileInStructure(fileName) {
    // Look for an exact match first
    let file = chatbotRepoStructure.find(f => f.path.toLowerCase() === fileName.toLowerCase());
    if (file) return file;
    // If not found, look for a path that ends with the filename
    file = chatbotRepoStructure.find(f => f.path.toLowerCase().endsWith('/' + fileName.toLowerCase()));
    return file || null;
}

/**
 * Fetches file content, using a cache to avoid redundant API calls.
 * @param {string} url - The API URL for the file content.
 * @returns {Promise<string>} The decoded file content.
 */
async function getFileContent(url) {
    if (fileContentCache.has(url)) {
        return fileContentCache.get(url);
    }
    const content = await fetchFileContent(url);
    fileContentCache.set(url, content);
    return content;
}