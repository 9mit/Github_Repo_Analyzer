document.addEventListener('DOMContentLoaded', () => {
    console.log('CodeBuddy: Initializing UI Logic...');

    // 1. Core Dashboard Elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const repoUrlInput = document.getElementById('repo-url');
    const loadingOverlay = document.getElementById('loading-overlay');
    const heroSection = document.getElementById('home');
    const dashboardSection = document.getElementById('dashboard');

    let currentRepoData = null;
    let currentRepoStructure = null;
    let currentRepoLanguages = null;
    let languageChart = null;

    if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalysis);
    if (repoUrlInput) {
        repoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAnalysis();
        });
    }

    // Tab switching
    const dashboardTabs = document.querySelector('.dashboard-tabs');
    if (dashboardTabs) {
        dashboardTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                switchTab(e.target.dataset.tab);
            }
        });
    }

    // Mode Toggle
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const repoInputContainer = document.getElementById('repo-input-container');
    const profileInputContainer = document.getElementById('profile-input-container');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'repo') {
                if (repoInputContainer) repoInputContainer.classList.remove('hidden');
                if (profileInputContainer) profileInputContainer.classList.add('hidden');
            } else {
                if (repoInputContainer) repoInputContainer.classList.add('hidden');
                if (profileInputContainer) profileInputContainer.classList.remove('hidden');
            }
        });
    });

    // Expose loading functions
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;

    // AI Generation Buttons
    const genReadmeBtn = document.getElementById('generate-readme-btn');
    if (genReadmeBtn) {
        genReadmeBtn.addEventListener('click', async () => {
            const readmeContentEl = document.getElementById('readme-content');
            if (!readmeContentEl || !currentRepoStructure || !currentRepoData) return;

            readmeContentEl.innerHTML = `<h3><i class="fas fa-sync fa-spin"></i> Generating smart README...</h3>`;
            try {
                const packageJsonFile = currentRepoStructure.find(f => f.path && f.path.toLowerCase().endsWith('package.json'));
                let packageJsonContent = null;
                if (packageJsonFile) {
                    try { packageJsonContent = await fetchFileContent(packageJsonFile.url); } catch (e) { console.warn('Could not fetch package.json:', e); }
                }
                const content = generateSmartReadme(currentRepoData, currentRepoLanguages, currentRepoStructure, packageJsonContent);
                const safeHtml = renderMarkdownSafely(content);
                readmeContentEl.innerHTML = safeHtml;
                readmeContentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
            } catch (error) {
                console.error('README generation failed:', error);
                readmeContentEl.innerHTML = `<p class="error">Failed to generate README: ${error.message}</p>`;
            }
        });
    }

    const genAnalysisBtn = document.getElementById('generate-analysis-btn');
    if (genAnalysisBtn) {
        genAnalysisBtn.addEventListener('click', async () => {
            const analysisContentEl = document.getElementById('analysis-content');
            if (!analysisContentEl || !currentRepoStructure || !currentRepoData) return;

            analysisContentEl.innerHTML = `<h3><i class="fas fa-sync fa-spin"></i> Performing smart analysis...</h3>`;
            try {
                const packageJsonFile = currentRepoStructure.find(f => f.path && f.path.toLowerCase().endsWith('package.json'));
                let packageJsonContent = null;
                if (packageJsonFile) {
                    try { packageJsonContent = await fetchFileContent(packageJsonFile.url); } catch (e) { console.warn('Could not fetch package.json:', e); }
                }
                const content = generateSmartAnalysisReport(currentRepoData, currentRepoLanguages, currentRepoStructure, packageJsonContent);
                const safeHtml = renderMarkdownSafely(content);
                analysisContentEl.innerHTML = safeHtml;
                analysisContentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
            } catch (error) {
                console.error('Analysis generation failed:', error);
                analysisContentEl.innerHTML = `<p class="error">Failed to generate analysis: ${error.message}</p>`;
            }
        });
    }

    // Chatbot
    const sendMsgBtn = document.getElementById('send-message-btn');
    const userMsgInput = document.getElementById('user-message');
    if (sendMsgBtn) sendMsgBtn.addEventListener('click', sendChatMessage);
    if (userMsgInput) {
        userMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.addEventListener('click', async (e) => {
            if (e.target.matches('.chat-action-btn')) {
                const action = e.target.dataset.action;
                const url = e.target.dataset.url;
                const path = e.target.dataset.path;

                if (action === 'view-file') {
                    switchTab('structure');
                    const currentFileEl = document.getElementById('current-file');
                    const codeDisplayEl = document.getElementById('code-display');
                    if (currentFileEl) currentFileEl.textContent = `Loading ${path}...`;
                    if (codeDisplayEl) codeDisplayEl.textContent = '';
                    try {
                        const content = await fetchFileContent(url);
                        displayFileContent(path, content);
                    } catch (error) {
                        displayFileContent(path, `Error loading file: ${error.message}`);
                    }
                }
            }
        });
    }

    // Copy/Download buttons
    const btnMap = [
        { id: 'copy-code-btn', selector: '#code-display', type: 'Code', fn: copyToClipboard },
        { id: 'copy-readme-btn', selector: '#readme-content', type: 'README', fn: copyToClipboard },
        { id: 'copy-analysis-btn', selector: '#analysis-content', type: 'Analysis', fn: copyToClipboard },
        { id: 'download-readme-btn', filename: 'README.md', selector: '#readme-content', fn: downloadFile },
        { id: 'download-analysis-btn', filename: 'ANALYSIS.md', selector: '#analysis-content', fn: downloadFile }
    ];

    btnMap.forEach(config => {
        const btn = document.getElementById(config.id);
        if (btn) {
            btn.addEventListener('click', () => {
                if (config.fn === copyToClipboard) config.fn(config.selector, config.type);
                else config.fn(config.filename, config.selector);
            });
        }
    });

    const copyCommandBtn = document.querySelector('.copy-command');
    if (copyCommandBtn) copyCommandBtn.addEventListener('click', copyToClipboard.bind(null, '#clone-command', 'Clone command'));

    const downloadZipBtn = document.getElementById('download-zip-btn');
    if (downloadZipBtn) {
        downloadZipBtn.addEventListener('click', () => {
            if (!currentRepoData) {
                alert('Please analyze a repository first.');
                return;
            }
            const zipUrl = `https://github.com/${currentRepoData.owner.login}/${currentRepoData.name}/archive/refs/heads/${currentRepoData.default_branch}.zip`;
            window.open(zipUrl, '_blank');
        });
    }

    // --- Main Functions ---

    async function handleAnalysis() {
        if (!repoUrlInput) return;
        const url = repoUrlInput.value;
        const repoInfo = extractRepoInfo(url);

        if (!repoInfo) {
            alert('Invalid GitHub repository URL. Please enter a valid URL like https://github.com/owner/repo');
            return;
        }

        showLoading('Analyzing repository...');
        try {
            const [repoData, languages] = await Promise.all([
                fetchRepositoryData(repoInfo.owner, repoInfo.repo),
                fetchLanguages(repoInfo.owner, repoInfo.repo)
            ]);

            currentRepoData = repoData;
            currentRepoLanguages = languages;

            showLoading('Fetching file structure...');
            currentRepoStructure = await fetchRepositoryStructure(repoInfo.owner, repoInfo.repo, repoData.default_branch);

            populateDashboard();

            if (heroSection) heroSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');

            // Hide loading AFTER successful population
            hideLoading();

        } catch (error) {
            hideLoading();
            if (error.message && error.message.includes('Authorization')) {
                alert('🛑 GitHub API Authorization Error.\n\nPlease check server-side configuration (GITHUB_PAT).');
            } else {
                alert(`Error: ${error.message}`);
                console.error(error);
            }
        }
    }

    function populateDashboard() {
        const nameEl = document.getElementById('repo-name');
        const ownerEl = document.getElementById('repo-owner');
        const starsEl = document.getElementById('repo-stars');
        const forksEl = document.getElementById('repo-forks');
        const cloneEl = document.getElementById('clone-command');
        const ghBtn = document.getElementById('view-github-btn');

        if (nameEl) nameEl.textContent = currentRepoData.full_name;
        if (ownerEl) ownerEl.innerHTML = `<a href="${currentRepoData.owner.html_url}" target="_blank">${currentRepoData.owner.login}</a>`;
        if (starsEl) starsEl.innerHTML = `<i class="fas fa-star"></i> ${currentRepoData.stargazers_count}`;
        if (forksEl) forksEl.innerHTML = `<i class="fas fa-code-branch"></i> ${currentRepoData.forks_count}`;

        const nestedStructure = createFileStructure(currentRepoStructure);
        const fileTreeContainer = document.getElementById('file-tree-container');
        if (fileTreeContainer) renderFileTree(nestedStructure, fileTreeContainer);

        fetchReadme(currentRepoData.owner.login, currentRepoData.name)
            .then(content => {
                const readmeEl = document.getElementById('readme-content');
                if (readmeEl) {
                    const safeHtml = renderMarkdownSafely(content);
                    readmeEl.innerHTML = safeHtml;
                    readmeEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
                }
            });

        renderTechStack();
        if (typeof initChatbot === 'function') initChatbot(currentRepoData, currentRepoStructure, currentRepoLanguages);

        if (cloneEl) cloneEl.textContent = `git clone ${currentRepoData.clone_url}`;
        if (ghBtn) ghBtn.href = currentRepoData.html_url;
    }

    function renderTechStack() {
        const summaryContainer = document.getElementById('tech-summary-content');
        if (summaryContainer) {
            let summaryHTML = `<p><strong>Primary Language:</strong> ${currentRepoData.language || 'N/A'}</p><ul>`;
            for (const lang in currentRepoLanguages) summaryHTML += `<li>${lang}</li>`;
            summaryHTML += '</ul>';
            summaryContainer.innerHTML = summaryHTML;
        }

        const chartEl = document.getElementById('language-chart');
        if (chartEl && Object.keys(currentRepoLanguages).length > 0) {
            const ctx = chartEl.getContext('2d');
            if (languageChart) languageChart.destroy();
            languageChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(currentRepoLanguages),
                    datasets: [{
                        label: 'Language Distribution',
                        data: Object.values(currentRepoLanguages),
                        backgroundColor: ['#4f46e5', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#374151'],
                        borderColor: '#1f2937',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#d1d5db' } } }
                }
            });
        }
    }

    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        const activePane = document.getElementById(`${tabId}-tab`);
        if (activePane) activePane.classList.add('active');
    }

    function showLoading(message) {
        const msgEl = document.getElementById('loading-message');
        if (msgEl) msgEl.textContent = message;
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    /**
     * Safely render markdown to sanitized HTML
     */
    function renderMarkdownSafely(content) {
        try {
            const rawHtml = marked.parse(content);
            return window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
        } catch (error) {
            console.error('Markdown rendering failed:', error);
            return `<pre>${content}</pre>`;
        }
    }

    function copyToClipboard(selector, type) {
        const element = document.querySelector(selector);
        if (!element) return;
        const textToCopy = element.innerText || element.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`${type} copied to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function downloadFile(filename, contentSelector) {
        const element = document.querySelector(contentSelector);
        if (!element) return;
        const content = element.innerText;
        const link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
