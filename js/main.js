document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const repoUrlInput = document.getElementById('repo-url');
    const loadingOverlay = document.getElementById('loading-overlay');
    const heroSection = document.getElementById('home');
    const dashboardSection = document.getElementById('dashboard');

    let currentRepoData = null;
    let currentRepoStructure = null;
    let currentRepoLanguages = null;
    let languageChart = null;

    // --- Event Listeners ---
    
    analyzeBtn.addEventListener('click', handleAnalysis);
    repoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnalysis();
    });

    // Tab switching
    document.querySelector('.dashboard-tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            switchTab(e.target.dataset.tab);
        }
    });

    // Documentation generation
    document.getElementById('generate-readme-btn').addEventListener('click', () => {
        const content = generateImprovedReadme(currentRepoData, currentRepoLanguages);
        document.getElementById('readme-content').innerHTML = marked.parse(content);
    });
    document.getElementById('generate-analysis-btn').addEventListener('click', () => {
        const content = generateAnalysisReport(currentRepoData, currentRepoLanguages, currentRepoStructure);
        document.getElementById('analysis-content').innerHTML = marked.parse(content);
    });
    
    // Chatbot
    document.getElementById('send-message-btn').addEventListener('click', sendChatMessage);
    document.getElementById('user-message').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Event listener for interactive chat buttons (using event delegation)
    document.getElementById('chat-messages').addEventListener('click', async (e) => {
        if (e.target.matches('.chat-action-btn')) {
            const action = e.target.dataset.action;
            const url = e.target.dataset.url;
            const path = e.target.dataset.path;

            if (action === 'view-file') {
                // Switch to the structure tab
                switchTab('structure');

                // Show a loading state in the code viewer
                document.getElementById('current-file').textContent = `Loading ${path}...`;
                document.getElementById('code-display').textContent = '';

                // Fetch and display the file
                try {
                    const content = await fetchFileContent(url);
                    displayFileContent(path, content);
                } catch (error) {
                    displayFileContent(path, `Error loading file: ${error.message}`);
                }
            }
        }
    });

    // Copy/Download buttons
    document.getElementById('copy-code-btn').addEventListener('click', copyToClipboard.bind(null, '#code-display', 'Code'));
    document.getElementById('copy-readme-btn').addEventListener('click', copyToClipboard.bind(null, '#readme-content', 'README'));
    document.getElementById('copy-analysis-btn').addEventListener('click', copyToClipboard.bind(null, '#analysis-content', 'Analysis'));
    document.getElementById('download-readme-btn').addEventListener('click', downloadFile.bind(null, 'README.md', '#readme-content'));
    document.getElementById('download-analysis-btn').addEventListener('click', downloadFile.bind(null, 'ANALYSIS.md', '#analysis-content'));
    document.querySelector('.copy-command').addEventListener('click', copyToClipboard.bind(null, '#clone-command', 'Clone command'));


    // --- Main Functions ---

    /**
     * Handles the entire repository analysis workflow.
     */
    async function handleAnalysis() {
        const url = repoUrlInput.value;
        const repoInfo = extractRepoInfo(url);

        if (!repoInfo) {
            alert('Invalid GitHub repository URL.');
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
            
            heroSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        } finally {
            hideLoading();
        }
    }

    /**
     * Populates the dashboard with fetched data.
     */
    function populateDashboard() {
        // Header
        document.getElementById('repo-name').textContent = currentRepoData.full_name;
        document.getElementById('repo-owner').innerHTML = `<a href="${currentRepoData.owner.html_url}" target="_blank">${currentRepoData.owner.login}</a>`;
        document.getElementById('repo-stars').innerHTML = `<i class="fas fa-star"></i> ${currentRepoData.stargazers_count}`;
        document.getElementById('repo-forks').innerHTML = `<i class="fas fa-code-branch"></i> ${currentRepoData.forks_count}`;

        // Structure Tab
        const nestedStructure = createFileStructure(currentRepoStructure);
        renderFileTree(nestedStructure, document.getElementById('file-tree-container'));
        
        // README Tab
        fetchReadme(currentRepoData.owner.login, currentRepoData.name)
            .then(content => {
                document.getElementById('readme-content').innerHTML = marked.parse(content);
            });
        
        // Tech Stack Tab
        renderTechStack();
        
        // Chatbot Initialization
        initChatbot(currentRepoData, currentRepoStructure, currentRepoLanguages);

        // Management Tab
        document.getElementById('clone-command').textContent = `git clone ${currentRepoData.clone_url}`;
    }
    
    /**
     * Renders the tech stack information and chart.
     */
    function renderTechStack() {
        // Summary
        const summaryContainer = document.getElementById('tech-summary-content');
        let summaryHTML = `<p><strong>Primary Language:</strong> ${currentRepoData.language}</p>`;
        summaryHTML += '<ul>';
        for (const lang in currentRepoLanguages) {
            summaryHTML += `<li>${lang}</li>`;
        }
        summaryHTML += '</ul>';
        summaryContainer.innerHTML = summaryHTML;
        
        // Chart
        const ctx = document.getElementById('language-chart').getContext('2d');
        if (languageChart) languageChart.destroy();
        languageChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(currentRepoLanguages),
                datasets: [{
                    label: 'Language Distribution',
                    data: Object.values(currentRepoLanguages),
                    backgroundColor: [
                        '#3498db', '#f1c40f', '#e74c3c', '#9b59b6',
                        '#2ecc71', '#e67e22', '#1abc9c', '#34495e'
                    ],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    /**
     * Switches the active tab in the dashboard.
     * @param {string} tabId - The ID of the tab to activate.
     */
    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }
    
    // --- Utility Functions ---
    
    function showLoading(message) {
        document.getElementById('loading-message').textContent = message;
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }
    
    function copyToClipboard(selector, type) {
        const element = document.querySelector(selector);
        const textToCopy = element.innerText || element.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`${type} copied to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function downloadFile(filename, contentSelector) {
        const content = document.querySelector(contentSelector).innerText;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
});