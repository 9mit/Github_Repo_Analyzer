/**
 * Enhanced Chatbot - Smart Rule-Based AI Assistant for CodeBuddy
 * Uses pattern matching, NLP-like intent recognition, and context-aware responses
 */

// ============================================================================
// CONTEXT AND STATE MANAGEMENT
// ============================================================================

let chatbotRepoData = null;
let chatbotRepoStructure = null;
let chatbotLanguages = null;
const fileContentCache = new Map();

// Conversation context for follow-up questions
let conversationContext = {
    lastIntent: null,
    lastFile: null,
    lastTopic: null,
    mentionedFiles: [],
    mentionedFunctions: []
};

/**
 * Initializes the chatbot with repository context.
 */
function initChatbot(repoData, structure, languages) {
    chatbotRepoData = repoData;
    chatbotRepoStructure = structure;
    chatbotLanguages = languages;
    fileContentCache.clear();
    conversationContext = {
        lastIntent: null,
        lastFile: null,
        lastTopic: null,
        mentionedFiles: [],
        mentionedFunctions: []
    };
}

// ============================================================================
// USER INTERACTION
// ============================================================================

async function sendChatMessage() {
    const userInput = document.getElementById('user-message');
    const message = userInput.value.trim();
    if (message === '') return;

    addMessageToChat('user', message);
    userInput.value = '';

    // Show typing indicator
    addMessageToChat('bot', `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `, true);

    const response = await generateChatbotResponse(message);

    setTimeout(() => {
        updateLastBotMessage(response);
    }, 500 + Math.random() * 500);
}

function addMessageToChat(sender, html, isTyping = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    if (isTyping) messageDiv.classList.add('typing');
    const safeHtml = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    messageDiv.innerHTML = `<div class="message-content">${safeHtml}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateLastBotMessage(html) {
    const typingMessage = document.querySelector('.chat-message.bot.typing');
    if (typingMessage) {
        const safeHtml = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
        typingMessage.querySelector('.message-content').innerHTML = safeHtml;
        typingMessage.classList.remove('typing');
    }
}

// ============================================================================
// ENHANCED INTENT SYSTEM
// ============================================================================

const intents = [
    // Greetings
    {
        name: 'greet',
        patterns: [/^(hi|hello|hey|howdy|yo|sup)$/i, /^good (morning|afternoon|evening)/i],
        handler: () => {
            const greetings = [
                `Hello! 👋 I'm your CodeBuddy assistant for the **${chatbotRepoData.name}** repository. How can I help?`,
                `Hey there! Ready to explore **${chatbotRepoData.name}**? Ask me anything!`,
                `Hi! I'm here to help you understand this codebase. What would you like to know?`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
    },

    // About/Description
    {
        name: 'about',
        patterns: [
            /^(what is this|about|describe|tell me about|overview|summary)/i,
            /what('s| is) this (repo|repository|project)/i
        ],
        handler: handleAbout
    },

    // Find File
    {
        name: 'find_file',
        patterns: [
            /(find|show|where|open|get|locate|search for) (the |a )?(.+\.\w+)/i,
            /where (is|can i find) (the )?(.+)/i
        ],
        handler: handleFindFile
    },

    // List Files
    {
        name: 'list_files',
        patterns: [
            /(list|show|what are|display) (all )?(the )?(files|structure)/i,
            /file (structure|tree|list)/i
        ],
        handler: handleListFiles
    },

    // Dependencies
    {
        name: 'dependencies',
        patterns: [
            /(dependencies|packages|libraries|libs|modules)/i,
            /what (packages|dependencies|libs|libraries) (does|are|is)/i
        ],
        handler: handleListDependencies
    },

    // Explain Code/Function
    {
        name: 'explain_code',
        patterns: [
            /(what (does|is)|explain|describe|how does) [`']?(\w+)[`']? (function|method|do|work|mean)/i,
            /explain [`']?(\w+)[`']?/i,
            /what (does|is) [`']?(\w+)[`']?/i
        ],
        handler: handleExplainCode
    },

    // Tech Stack
    {
        name: 'tech_stack',
        patterns: [
            /(tech|technology) (stack|used)/i,
            /what (tech|technologies|frameworks|tools)/i,
            /(frameworks?|libraries) used/i,
            /built with/i
        ],
        handler: handleTechStack
    },

    // Metadata (stars, forks, owner, license)
    {
        name: 'metadata',
        patterns: [
            /(owner|author|creator|who (made|created|owns))/i,
            /(how many |)(stars|stargazers)/i,
            /(how many |)(forks)/i,
            /(what |)(license|licensing)/i,
            /(when was|created|creation date)/i
        ],
        handler: handleMetadata
    },

    // Project Structure
    {
        name: 'structure',
        patterns: [
            /(project |folder |directory )(structure|layout|organization)/i,
            /how is (this |the )?(project |code )?(organized|structured)/i
        ],
        handler: handleStructure
    },

    // Scripts/Commands
    {
        name: 'scripts',
        patterns: [
            /(available |npm |yarn )?(scripts|commands)/i,
            /how (do i|to) (run|start|build|test)/i,
            /(run|start|build|test) (the |this )?(project|app|application)/i
        ],
        handler: handleScripts
    },

    // Main Entry Point
    {
        name: 'entry_point',
        patterns: [
            /(main |entry )?(file|point)/i,
            /where (does|do) (the |)(code|app|application) start/i
        ],
        handler: handleEntryPoint
    },

    // Environment/Config
    {
        name: 'config',
        patterns: [
            /(config|configuration|settings|environment|env)/i,
            /how (do i|to) configure/i
        ],
        handler: handleConfig
    },

    // Contributing
    {
        name: 'contributing',
        patterns: [
            /(how (do i|can i|to) )?(contribute|contributing)/i,
            /\b(pull request|pr|fork|contribution)\b/i
        ],
        handler: handleContributing
    },

    // Code Quality/Best Practices
    {
        name: 'code_quality',
        patterns: [
            /(code )?quality/i,
            /(tests?|testing|test coverage)/i,
            /(linting|eslint|prettier)/i,
            /ci\/cd|github actions|workflows/i
        ],
        handler: handleCodeQuality
    },

    // Compare/Similar
    {
        name: 'compare',
        patterns: [
            /(similar|like|compare|comparison)/i,
            /alternatives?/i
        ],
        handler: () => `I can analyze this repository, but I don't have access to compare it with other projects. However, based on the tech stack, you might want to search for similar projects using the same frameworks.`
    },

    // Help
    {
        name: 'help',
        patterns: [/^help$/i, /what can you do/i, /commands?/i, /capabilities/i],
        handler: handleHelp
    },

    // Thanks
    {
        name: 'thanks',
        patterns: [/thanks?|thank you|thx|cheers/i],
        handler: () => {
            const responses = [
                "You're welcome! 😊 Feel free to ask anything else!",
                "Happy to help! Let me know if you need anything else.",
                "Anytime! Is there anything else you'd like to know about the repository?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
];

// ============================================================================
// INTENT HANDLERS
// ============================================================================

function handleAbout() {
    conversationContext.lastIntent = 'about';

    const languageList = Object.keys(chatbotLanguages).slice(0, 3).join(', ');
    const fileCount = chatbotRepoStructure.filter(f => f.type === 'blob').length;

    let response = `## 📖 About ${chatbotRepoData.name}\n\n`;
    response += `${chatbotRepoData.description || 'No description provided.'}\n\n`;
    response += `**Key Facts:**\n`;
    response += `- ⭐ ${chatbotRepoData.stargazers_count.toLocaleString()} stars\n`;
    response += `- 🍴 ${chatbotRepoData.forks_count} forks\n`;
    response += `- 📁 ${fileCount} files\n`;
    response += `- 💻 Primary: ${languageList}\n`;

    if (chatbotRepoData.license) {
        response += `- 📄 License: ${chatbotRepoData.license.name}\n`;
    }

    return response;
}

function handleFindFile(match, message) {
    // Try to extract filename from different pattern groups
    let fileName = match[3] || match[2] || '';
    fileName = fileName.trim().replace(/['"]/g, '');

    if (!fileName) {
        return "Please specify a file name to search for.";
    }

    const file = findFileInStructure(fileName);

    if (file) {
        conversationContext.lastFile = file;
        conversationContext.mentionedFiles.push(file.path);

        return `✅ Found \`${file.path}\`!<br><br>
            <button class="chat-action-btn" data-action="view-file" data-url="${file.url}" data-path="${file.path}">
                <i class="fas fa-eye"></i> View File
            </button>`;
    }

    // Suggest similar files
    const suggestions = chatbotRepoStructure
        .filter(f => f.type === 'blob' && f.path.toLowerCase().includes(fileName.toLowerCase().split('.')[0]))
        .slice(0, 3);

    if (suggestions.length > 0) {
        let response = `❌ Couldn't find \`${fileName}\`. Did you mean:\n\n`;
        suggestions.forEach(s => {
            response += `- \`${s.path}\`\n`;
        });
        return response;
    }

    return `❌ Sorry, I couldn't find a file matching \`${fileName}\`. Try checking the file tree on the Structure tab.`;
}

function handleListFiles() {
    const files = chatbotRepoStructure.filter(f => f.type === 'blob');
    const dirs = new Set();

    files.forEach(f => {
        const dir = f.path.split('/')[0];
        if (dir && !dir.includes('.')) dirs.add(dir);
    });

    let response = `📁 **Project Overview**\n\n`;
    response += `This repository has **${files.length} files** in **${dirs.size} top-level directories**.\n\n`;
    response += `**Root Directories:**\n`;
    Array.from(dirs).slice(0, 10).forEach(dir => {
        const count = files.filter(f => f.path.startsWith(dir + '/')).length;
        response += `- 📂 \`${dir}/\` (${count} files)\n`;
    });

    const rootFiles = files.filter(f => !f.path.includes('/')).slice(0, 5);
    if (rootFiles.length > 0) {
        response += `\n**Root Files:**\n`;
        rootFiles.forEach(f => response += `- 📄 \`${f.path}\`\n`);
    }

    response += `\n_Use the Structure tab to browse the complete file tree._`;
    return response;
}

async function handleListDependencies() {
    const packageJson = findFileInStructure('package.json');
    const requirementsTxt = findFileInStructure('requirements.txt');

    if (packageJson) {
        try {
            const content = await getFileContent(packageJson.url);
            const data = JSON.parse(content);

            let response = `## 📦 Dependencies\n\n`;

            if (data.dependencies && Object.keys(data.dependencies).length > 0) {
                response += `### Production (${Object.keys(data.dependencies).length})\n`;
                Object.entries(data.dependencies).slice(0, 8).forEach(([name, version]) => {
                    response += `- \`${name}\`: ${version}\n`;
                });
                if (Object.keys(data.dependencies).length > 8) {
                    response += `- _...and ${Object.keys(data.dependencies).length - 8} more_\n`;
                }
            }

            if (data.devDependencies && Object.keys(data.devDependencies).length > 0) {
                response += `\n### Dev Dependencies (${Object.keys(data.devDependencies).length})\n`;
                Object.entries(data.devDependencies).slice(0, 5).forEach(([name, version]) => {
                    response += `- \`${name}\`: ${version}\n`;
                });
                if (Object.keys(data.devDependencies).length > 5) {
                    response += `- _...and ${Object.keys(data.devDependencies).length - 5} more_\n`;
                }
            }

            return response;
        } catch (error) {
            return 'Found `package.json` but had trouble reading it.';
        }
    }

    if (requirementsTxt) {
        try {
            const content = await getFileContent(requirementsTxt.url);
            const deps = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

            let response = `## 🐍 Python Dependencies\n\n`;
            deps.slice(0, 15).forEach(dep => response += `- \`${dep.trim()}\`\n`);
            if (deps.length > 15) response += `- _...and ${deps.length - 15} more_\n`;
            return response;
        } catch (error) {
            return 'Found `requirements.txt` but had trouble reading it.';
        }
    }

    return "Couldn't find a dependency file (`package.json` or `requirements.txt`).";
}

async function handleExplainCode(match, message) {
    // Extract function name from various pattern matches
    let functionName = match[3] || match[2] || match[1];
    if (!functionName) {
        const words = message.split(/\s+/);
        const codeWords = words.filter(w => /^[a-z_$][a-z0-9_$]*$/i.test(w) && w.length > 2);
        functionName = codeWords[codeWords.length - 1];
    }

    if (!functionName) {
        return "Please specify a function or code element to explain.";
    }

    // Search in JS/TS files
    const codeFiles = chatbotRepoStructure.filter(file =>
        /\.(js|jsx|ts|tsx|py|go|java)$/.test(file.path.toLowerCase())
    );

    for (const file of codeFiles.slice(0, 20)) {
        try {
            const content = await getFileContent(file.url);

            // Multiple patterns for different function declarations
            const patterns = [
                new RegExp(`function\\s+${functionName}\\s*\\(`, 's'),
                new RegExp(`(const|let|var)\\s+${functionName}\\s*=\\s*(async\\s*)?(\\([^)]*\\)|\\w+)\\s*=>`, 's'),
                new RegExp(`(const|let|var)\\s+${functionName}\\s*=\\s*function`, 's'),
                new RegExp(`${functionName}\\s*:\\s*function`, 's'),
                new RegExp(`async\\s+${functionName}\\s*\\(`, 's'),
                new RegExp(`def\\s+${functionName}\\s*\\(`, 's'), // Python
                new RegExp(`func\\s+${functionName}\\s*\\(`, 's'), // Go
            ];

            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    const lines = content.split('\n');
                    const startLine = lines.findIndex(line => pattern.test(line));

                    if (startLine !== -1) {
                        const codeSnippet = lines.slice(startLine, startLine + 12).join('\n');
                        const highlightedCode = hljs.highlightAuto(codeSnippet).value;

                        conversationContext.lastFile = file;
                        conversationContext.mentionedFunctions.push(functionName);

                        return `Found \`${functionName}\` in \`${file.path}\`:\n\n
                            <pre><code class="hljs">${highlightedCode}</code></pre>
                            <button class="chat-action-btn" data-action="view-file" data-url="${file.url}" data-path="${file.path}">
                                View Full File
                            </button>`;
                    }
                }
            }
        } catch (error) {
            continue;
        }
    }

    return `❌ Couldn't find \`${functionName}\` in the codebase. Make sure to spell it correctly!`;
}

function handleTechStack() {
    conversationContext.lastIntent = 'tech_stack';

    const allDeps = [];
    const packageJson = findFileInStructure('package.json');
    let frameworks = [];

    // Detect frameworks
    if (packageJson) {
        const frameworkPatterns = {
            'React': ['react', 'react-dom'],
            'Next.js': ['next'],
            'Vue.js': ['vue'],
            'Angular': ['@angular/core'],
            'Express': ['express'],
            'NestJS': ['@nestjs/core'],
            'Fastify': ['fastify'],
            'Tailwind CSS': ['tailwindcss'],
            'Bootstrap': ['bootstrap'],
            'Jest': ['jest'],
            'TypeScript': ['typescript']
        };

        // We'd need to read package.json here, but let's use structure hints
        Object.keys(frameworkPatterns).forEach(fw => {
            const configFiles = {
                'Next.js': 'next.config',
                'Tailwind CSS': 'tailwind.config',
                'TypeScript': 'tsconfig.json',
                'Jest': 'jest.config',
            };
            if (configFiles[fw] && chatbotRepoStructure.some(f => f.path.includes(configFiles[fw]))) {
                frameworks.push(fw);
            }
        });
    }

    // Check for common config files
    const configIndicators = {
        'Docker': ['Dockerfile', 'docker-compose'],
        'GitHub Actions': ['.github/workflows'],
        'ESLint': ['.eslintrc'],
        'Prettier': ['.prettierrc'],
        'Vite': ['vite.config'],
        'Webpack': ['webpack.config']
    };

    Object.entries(configIndicators).forEach(([tech, patterns]) => {
        if (patterns.some(p => chatbotRepoStructure.some(f => f.path.includes(p)))) {
            frameworks.push(tech);
        }
    });

    let response = `## 🛠️ Technology Stack\n\n`;

    response += `### Languages\n`;
    Object.entries(chatbotLanguages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([lang, bytes]) => {
            const percent = ((bytes / Object.values(chatbotLanguages).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            response += `- **${lang}**: ${percent}%\n`;
        });

    if (frameworks.length > 0) {
        response += `\n### Detected Tools & Frameworks\n`;
        frameworks.forEach(fw => response += `- ${fw}\n`);
    }

    return response;
}

function handleMetadata(match, message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('owner') || lowerMessage.includes('author') || lowerMessage.includes('who')) {
        return `👤 **Owner:** [${chatbotRepoData.owner.login}](${chatbotRepoData.owner.html_url})\n\nType: ${chatbotRepoData.owner.type}`;
    }
    if (lowerMessage.includes('star')) {
        return `⭐ This repository has **${chatbotRepoData.stargazers_count.toLocaleString()}** stars!`;
    }
    if (lowerMessage.includes('fork')) {
        return `🍴 This repository has been forked **${chatbotRepoData.forks_count.toLocaleString()}** times.`;
    }
    if (lowerMessage.includes('license')) {
        const license = chatbotRepoData.license;
        return license
            ? `📄 **License:** ${license.name}\n\nSPDX ID: \`${license.spdx_id}\``
            : `⚠️ No license specified for this repository.`;
    }
    if (lowerMessage.includes('created') || lowerMessage.includes('when')) {
        const created = new Date(chatbotRepoData.created_at);
        const updated = new Date(chatbotRepoData.updated_at);
        return `📅 **Created:** ${created.toLocaleDateString()}\n**Last Updated:** ${updated.toLocaleDateString()}`;
    }

    return handleAbout();
}

function handleStructure() {
    const files = chatbotRepoStructure.filter(f => f.type === 'blob');
    const topDirs = new Map();

    files.forEach(f => {
        const topDir = f.path.split('/')[0];
        if (topDir && !topDir.includes('.')) {
            topDirs.set(topDir, (topDirs.get(topDir) || 0) + 1);
        }
    });

    let response = `## 📁 Project Structure\n\n`;
    response += `The codebase is organized into **${topDirs.size} main directories**.\n\n`;

    // Common directory explanations
    const dirExplanations = {
        'src': 'Source code',
        'lib': 'Library/utility code',
        'test': 'Tests',
        'tests': 'Tests',
        '__tests__': 'Jest tests',
        'docs': 'Documentation',
        'public': 'Static assets',
        'assets': 'Media/resources',
        'components': 'UI components',
        'pages': 'Page components/routes',
        'api': 'API routes/handlers',
        'utils': 'Utilities',
        'helpers': 'Helper functions',
        'config': 'Configuration',
        'styles': 'Stylesheets',
        'css': 'CSS files',
        'js': 'JavaScript files'
    };

    const sortedDirs = [...topDirs.entries()].sort((a, b) => b[1] - a[1]);

    sortedDirs.slice(0, 10).forEach(([dir, count]) => {
        const explanation = dirExplanations[dir.toLowerCase()] || '';
        response += `- 📂 **${dir}/** (${count} files)${explanation ? ` - ${explanation}` : ''}\n`;
    });

    return response;
}

async function handleScripts() {
    const packageJson = findFileInStructure('package.json');

    if (!packageJson) {
        return "No `package.json` found. This might not be a Node.js project.";
    }

    try {
        const content = await getFileContent(packageJson.url);
        const data = JSON.parse(content);

        if (!data.scripts || Object.keys(data.scripts).length === 0) {
            return "No scripts defined in `package.json`.";
        }

        let response = `## 📜 Available Scripts\n\n`;

        const importantScripts = ['dev', 'start', 'build', 'test', 'lint'];
        const otherScripts = [];

        importantScripts.forEach(name => {
            if (data.scripts[name]) {
                response += `### \`npm run ${name}\`\n\`\`\`bash\n${data.scripts[name]}\n\`\`\`\n\n`;
            }
        });

        Object.keys(data.scripts).forEach(name => {
            if (!importantScripts.includes(name)) {
                otherScripts.push(name);
            }
        });

        if (otherScripts.length > 0) {
            response += `**Other scripts:** ${otherScripts.map(s => `\`${s}\``).join(', ')}`;
        }

        return response;
    } catch (error) {
        return "Had trouble reading `package.json`.";
    }
}

function handleEntryPoint() {
    const commonEntryPoints = [
        'index.js', 'main.js', 'app.js', 'server.js',
        'src/index.js', 'src/main.js', 'src/App.js', 'src/app.js',
        'index.ts', 'src/index.ts', 'src/main.ts',
        'app.py', 'main.py', '__main__.py',
        'main.go', 'cmd/main.go'
    ];

    for (const entry of commonEntryPoints) {
        const file = chatbotRepoStructure.find(f =>
            f.path.toLowerCase() === entry.toLowerCase()
        );
        if (file) {
            return `🚀 **Entry Point:** \`${file.path}\`\n\n
                <button class="chat-action-btn" data-action="view-file" data-url="${file.url}" data-path="${file.path}">
                    View Entry File
                </button>`;
        }
    }

    return "Couldn't automatically detect the entry point. Check the project's README or `package.json` for usage instructions.";
}

function handleConfig() {
    const configFiles = chatbotRepoStructure.filter(f => {
        const name = f.path.toLowerCase();
        return name.includes('config') ||
            name.includes('.env') ||
            name.includes('settings') ||
            name.endsWith('.json') && (name.includes('rc') || name.includes('config'));
    }).slice(0, 10);

    if (configFiles.length === 0) {
        return "No obvious configuration files found.";
    }

    let response = `## ⚙️ Configuration Files\n\n`;
    configFiles.forEach(f => {
        response += `- 📄 \`${f.path}\`\n`;
    });

    const envExample = findFileInStructure('.env.example') || findFileInStructure('.env.template');
    if (envExample) {
        response += `\n_Check \`${envExample.path}\` for environment variable setup._`;
    }

    return response;
}

function handleContributing() {
    const contributingFile = findFileInStructure('CONTRIBUTING.md') ||
        findFileInStructure('CONTRIBUTING') ||
        findFileInStructure('docs/contributing.md');

    let response = `## 🤝 How to Contribute\n\n`;

    if (contributingFile) {
        response += `This project has a contributing guide!\n\n
            <button class="chat-action-btn" data-action="view-file" data-url="${contributingFile.url}" data-path="${contributingFile.path}">
                View Contributing Guide
            </button>\n\n`;
    }

    response += `**Quick Steps:**\n`;
    response += `1. Fork the repository\n`;
    response += `2. Create a feature branch: \`git checkout -b feature/your-feature\`\n`;
    response += `3. Make your changes\n`;
    response += `4. Commit: \`git commit -m 'Add feature'\`\n`;
    response += `5. Push: \`git push origin feature/your-feature\`\n`;
    response += `6. Open a Pull Request\n`;

    return response;
}

function handleCodeQuality() {
    const indicators = {
        'Tests': chatbotRepoStructure.some(f => f.path.includes('test') || f.path.includes('spec')),
        'CI/CD': chatbotRepoStructure.some(f => f.path.includes('.github/workflows')),
        'ESLint': chatbotRepoStructure.some(f => f.path.includes('.eslintrc')),
        'Prettier': chatbotRepoStructure.some(f => f.path.includes('.prettierrc')),
        'TypeScript': chatbotRepoStructure.some(f => f.path.includes('tsconfig.json')),
        '.gitignore': chatbotRepoStructure.some(f => f.path === '.gitignore'),
        'EditorConfig': chatbotRepoStructure.some(f => f.path === '.editorconfig')
    };

    const score = Object.values(indicators).filter(v => v).length;

    let response = `## ✅ Code Quality\n\n`;
    response += `**Score: ${score}/${Object.keys(indicators).length}**\n\n`;

    Object.entries(indicators).forEach(([name, present]) => {
        response += `- ${present ? '✅' : '❌'} ${name}\n`;
    });

    return response;
}

function handleHelp() {
    return `## 🤖 What I Can Do\n\n
**📁 File Operations**
- "Find package.json"
- "Show me main.js"
- "List all files"

**📦 Dependencies**
- "What dependencies are used?"
- "Show packages"

**💻 Code**
- "Explain handleAnalysis function"
- "What does sendMessage do?"

**🛠️ Project Info**
- "What is this project?"
- "Tech stack"
- "How to run this project?"
- "Available scripts"

**📊 Metadata**
- "Who is the owner?"
- "How many stars?"
- "What license?"

**🤝 Contributing**
- "How to contribute?"
- "Code quality"

_Just type naturally - I'll try to understand!_`;
}

// ============================================================================
// RESPONSE GENERATION - Smart API Usage
// ============================================================================

// Rate limiting configuration
const RATE_LIMIT = {
    // Use config value if available, otherwise default to 20
    get maxRequestsPerHour() {
        return (window.CONFIG && window.CONFIG.AI_MAX_REQUESTS_PER_HOUR) || 20;
    },
    storageKey: 'codebuddy_ai_usage'
};

/**
 * Get current API usage stats
 */
function getApiUsage() {
    const stored = localStorage.getItem(RATE_LIMIT.storageKey);
    if (!stored) {
        return { count: 0, resetTime: Date.now() + 3600000 };
    }

    const usage = JSON.parse(stored);

    // Reset if hour has passed
    if (Date.now() > usage.resetTime) {
        return { count: 0, resetTime: Date.now() + 3600000 };
    }

    return usage;
}

/**
 * Record an API call
 */
function recordApiCall() {
    const usage = getApiUsage();
    usage.count++;
    localStorage.setItem(RATE_LIMIT.storageKey, JSON.stringify(usage));
    return usage;
}

/**
 * Check if we can make an API call
 */
function canMakeApiCall() {
    const usage = getApiUsage();
    return usage.count < RATE_LIMIT.maxRequestsPerHour;
}

/**
 * Get remaining API calls
 */
function getRemainingApiCalls() {
    const usage = getApiUsage();
    return Math.max(0, RATE_LIMIT.maxRequestsPerHour - usage.count);
}

/**
 * Main response generation - SMART API USAGE
 * Priority: Rule-based first, AI only when necessary
 */
async function generateChatbotResponse(message) {
    if (!chatbotRepoData) {
        return "⚠️ Please analyze a repository first.";
    }

    const cleanMessage = message.trim().toLowerCase();

    // ========================================
    // STEP 1: Try rule-based intents FIRST
    // ========================================
    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            const match = message.match(pattern);
            if (match) {
                conversationContext.lastIntent = intent.name;
                const response = await intent.handler(match, message);

                // If response indicates failure/not found, try AI instead
                // Check for error indicators in response
                if (response &&
                    !response.includes('❌') &&
                    !response.includes('couldn\'t find') &&
                    !response.includes('not sure') &&
                    !response.includes('No ') &&
                    !response.includes('Unable to')) {
                    return response;
                }

                // Rule-based failed, continue to AI fallback
                break;
            }
        }
    }

    // ========================================
    // STEP 2: Check if AI is available and within limits
    // ========================================
    const hasApiKey = window.AIEngine && window.AIEngine.hasGroqApiKey();
    const withinLimits = canMakeApiCall();
    const remaining = getRemainingApiCalls();

    if (!hasApiKey) {
        return `🤔 I couldn't understand that question with basic mode.\n\n
            Try asking:\n
            - "help" - see what I can do\n
            - "about" - learn about this project\n
            - "find [filename]" - locate a file`;
    }

    if (!withinLimits) {
        const usage = getApiUsage();
        const resetIn = Math.ceil((usage.resetTime - Date.now()) / 60000);
        return `⚠️ **AI limit reached** (${RATE_LIMIT.maxRequestsPerHour}/hour)\n\n
            Resets in ~${resetIn} minutes.\n\n
            In the meantime, try these questions I can answer:\n
            - "help" - see all commands\n
            - "about" / "dependencies" / "tech stack"\n
            - "find [filename]" / "explain [function]"`;
    }

    // ========================================
    // STEP 3: Use AI for complex/unmatched queries
    // ========================================
    try {
        // Record the API call
        recordApiCall();
        const newRemaining = getRemainingApiCalls();

        const aiResponse = await window.AIEngine.generateAIResponse(message, {
            repoData: chatbotRepoData,
            structure: chatbotRepoStructure,
            languages: chatbotLanguages
        });

        if (aiResponse) {
            // Format response with usage indicator
            const usageNote = newRemaining <= 5
                ? `<small class="ai-usage-warning">🔋 ${newRemaining} AI queries left this hour</small><br>`
                : '';
            return `<span class="ai-badge"><i class="fas fa-brain"></i> AI</span>${usageNote}<br>${formatAIResponse(aiResponse)}`;
        }
    } catch (error) {
        console.error('AI response failed:', error);
        return `❌ AI request failed. Try a simpler question or use these commands:\n
            - "help" - see what I can do\n
            - "about" - project overview\n
            - "dependencies" - list packages`;
    }

    return `🤔 I couldn't get a response. Try:\n\n
- "help" - see what I can do\n
- "about" - learn about this project\n
- "find [filename]" - locate a file`;
}

/**
 * Format AI response with basic markdown to HTML conversion
 */
function formatAIResponse(text) {
    // Convert markdown code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Convert bullet points
    text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convert line breaks
    text = text.replace(/\n/g, '<br>');

    return text;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findFileInStructure(fileName) {
    const lowerName = fileName.toLowerCase();

    // Exact match
    let file = chatbotRepoStructure.find(f =>
        f.type === 'blob' && f.path.toLowerCase() === lowerName
    );
    if (file) return file;

    // Ends with filename
    file = chatbotRepoStructure.find(f =>
        f.type === 'blob' && f.path.toLowerCase().endsWith('/' + lowerName)
    );
    if (file) return file;

    // Contains filename
    file = chatbotRepoStructure.find(f =>
        f.type === 'blob' && f.path.toLowerCase().includes(lowerName)
    );
    return file || null;
}

async function getFileContent(url) {
    if (fileContentCache.has(url)) {
        return fileContentCache.get(url);
    }
    const content = await fetchFileContent(url);
    fileContentCache.set(url, content);
    return content;
}