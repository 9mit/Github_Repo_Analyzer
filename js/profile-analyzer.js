/**
 * Logic for the GitHub Profile Analyzer feature.
 * Analyzes all public repositories of a user and extracts deployment links.
 */

document.addEventListener('DOMContentLoaded', () => {
    const analyzeProfileBtn = document.getElementById('analyze-profile-btn');
    const profileUrlInput = document.getElementById('profile-url');
    const profileDashboard = document.getElementById('profile-dashboard');
    const heroSection = document.getElementById('home');
    const dashboardSection = document.getElementById('dashboard'); // Repository dashboard
    const profileReposBody = document.getElementById('profile-repos-body');
    const profileNameDisplay = document.getElementById('profile-name-display');
    const profileRepoCount = document.getElementById('profile-repo-count');

    // Guard: if critical elements are missing, exit gracefully
    if (!analyzeProfileBtn || !profileUrlInput) {
        console.warn('Profile analyzer: required DOM elements not found.');
        return;
    }

    // Deployment link regex
    const DEPLOY_DOMAINS = [
        'vercel\\.app', 'netlify\\.app', 'github\\.io', 'heroku\\.com', 
        'pages\\.dev', 'railway\\.app', 'surge\\.sh', 'render\\.com', 'azurewebsites\\.net', 'onrender\\.com'
    ];
    const deployRegex = new RegExp(`https?://[^\\s<>"\']+\\.(?:${DEPLOY_DOMAINS.join('|')})[^\\s<>"\']*`, 'i');
    
    // Markdown link regex for "Live", "Demo", "Website"
    const markdownLinkRegex = /\[(?:Live|Demo|Website|Preview|Live Site)\]\((https?:\/\/[^\)]+)\)/i;

    analyzeProfileBtn.addEventListener('click', handleProfileAnalysis);
    profileUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleProfileAnalysis();
    });

    let currentProfileRepositories = [];
    let currentUsername = "";

    /**
     * Main handler for profile analysis
     */
    async function handleProfileAnalysis() {
        const input = profileUrlInput.value;
        const username = extractProfileInfo(input);

        if (!username) {
            alert('Please enter a valid GitHub username or profile URL.');
            return;
        }

        currentUsername = username;
        if (window.showLoading) window.showLoading(`Fetching repositories for @${username}...`);

        try {
            const repositories = await fetchUserRepositories(username);
            currentProfileRepositories = repositories;
            
            if (profileNameDisplay) profileNameDisplay.textContent = `Repositories for @${username}`;
            if (profileRepoCount) profileRepoCount.innerHTML = `<i class="fas fa-book"></i> ${repositories.length} Public Repositories`;
            
            // Clear previous results
            if (profileReposBody) profileReposBody.innerHTML = '';
            const rankingContainer = document.getElementById('profile-ranking-container');
            if (rankingContainer) {
                rankingContainer.classList.add('hidden');
                rankingContainer.innerHTML = '';
            }
            
            // Switch UI
            if (heroSection) heroSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (profileDashboard) profileDashboard.classList.remove('hidden');

            // Process repositories
            for (let i = 0; i < repositories.length; i++) {
                const repo = repositories[i];
                const row = createRepoRow(i + 1, repo);
                profileReposBody.appendChild(row);

                // Asynchronously find deployment link to not block UI rendering
                findDeploymentLink(repo, row.querySelector('.deployment-cell'));
            }

        } catch (error) {
            console.error(error);
            if (error.message.includes('Authorization')) {
                alert('🛑 GitHub API Authorization Error.\n\nPlease check server-side configuration.');
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }

    /**
     * AI Ranking Event Listener
     */
    document.getElementById('generate-profile-ranking-btn').addEventListener('click', async () => {
        if (!currentProfileRepositories || currentProfileRepositories.length === 0) {
            alert('No repositories available to rank.');
            return;
        }

        const rankingContainer = document.getElementById('profile-ranking-container');
        rankingContainer.classList.remove('hidden');
        rankingContainer.innerHTML = '<h3><i class="fas fa-magic fa-spin"></i> Principal Engineer is evaluating repositories...</h3>';
        
        // 1. Calculate max stars for normalization
        const maxStars = Math.max(...currentProfileRepositories.map(r => r.stargazers_count), 1);
        
        // 2. Score and Sort
        const scoredRepos = currentProfileRepositories.map(repo => {
            return {
                ...repo,
                compositeScore: calculateCompositeScore(repo, maxStars)
            };
        });
        
        scoredRepos.sort((a, b) => b.compositeScore - a.compositeScore);
        
        // 3. Take Top 5
        const top5 = scoredRepos.slice(0, 5);
        
        // 4. Send to AI
        if (window.AIEngine && window.AIEngine.generateProfileRanking) {
            const markdownResponse = await window.AIEngine.generateProfileRanking(currentUsername, top5);
            if (markdownResponse) {
                let parsedHTML = marked.parse(markdownResponse);
                rankingContainer.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(parsedHTML) : parsedHTML;
                rankingContainer.querySelectorAll('pre code').forEach(el => window.hljs && window.hljs.highlightElement(el));
            } else {
                rankingContainer.innerHTML = '<p class="error">Failed to generate expert ranking. Please check console.</p>';
            }
        } else {
            rankingContainer.innerHTML = '<p class="error">AI Engine not loaded properly.</p>';
        }
    });

    /**
     * Calculates the composite score for a repository
     */
    function calculateCompositeScore(repo, maxStars) {
        // Normalization formulas provided in specification
        const S = Math.log(1 + repo.stargazers_count) / Math.log(1 + maxStars);
        
        // Activity (A): Days since last update
        const daysSinceUpdate = (new Date() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24);
        const A = Math.max(0, 1 - (daysSinceUpdate / 365)); // 0 if older than a year
        
        // Language Relevance (L)
        const L = repo.language ? 1 : 0;
        
        // README / Quality (R): Approximate with description presence for now to avoid 100s of API calls
        const R = repo.description && repo.description.length > 20 ? 1 : 0;
        
        // Deployment (D)
        const D = repo.homepage ? 1 : 0;
        
        // Community (C)
        const C = Math.min(1, (repo.forks_count + repo.watchers_count) / 50);

        // Score = 0.3S + 0.2A + 0.15L + 0.15R + 0.10D + 0.10C
        return (0.30 * S) + (0.20 * A) + (0.15 * L) + (0.15 * R) + (0.10 * D) + (0.10 * C);
    }


    /**
     * Creates a skeleton row for the table
     */
    function createRepoRow(index, repo) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index}</td>
            <td>
                <a href="${repo.html_url}" target="_blank" class="repo-link">
                    ${repo.name}
                </a>
                ${repo.description ? `<p style="font-size: 0.8rem; margin: 4px 0 0; color: var(--text-muted);">${repo.description}</p>` : ''}
            </td>
            <td>
                <span class="star-badge">
                    <i class="fas fa-star"></i> ${repo.stargazers_count}
                </span>
            </td>
            <td class="deployment-cell">
                <i class="fas fa-spinner fa-spin"></i> Checking...
            </td>
        `;
        return tr;
    }

    /**
     * Tiered logic to find a deployment link
     */
    async function findDeploymentLink(repo, cell) {
        let deploymentUrl = null;

        // 1. Check homepage field
        if (repo.homepage && repo.homepage.trim()) {
            deploymentUrl = repo.homepage.trim();
        }

        // 2. Scan description for URLs if no homepage
        if (!deploymentUrl && repo.description) {
            const match = repo.description.match(deployRegex) || repo.description.match(/https?:\/\/[^\s]+/);
            if (match) {
                deploymentUrl = match[0];
            }
        }

        // 3. Fallback: Fetch README (if above failed)
        if (!deploymentUrl) {
            try {
                // We only fetch README if repo is not too large and we haven't found a link yet
                // Use the existing fetchReadme function from github-api.js
                const readme = await fetchReadme(repo.owner.login, repo.name);
                
                if (readme && readme !== "No README found." && readme !== "Error fetching README.") {
                    // Try markdown link first (more explicit)
                    const mdMatch = readme.match(markdownLinkRegex);
                    if (mdMatch) {
                        deploymentUrl = mdMatch[1];
                    } else {
                        // Look for any deployment domains in README
                        const domainMatch = readme.match(deployRegex);
                        if (domainMatch) {
                            deploymentUrl = domainMatch[0];
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch README for ${repo.name}`, e);
            }
        }

        // Update UI
        if (deploymentUrl) {
            // Ensure URL has protocol
            if (!deploymentUrl.startsWith('http')) {
                deploymentUrl = 'https://' + deploymentUrl;
            }
            
            cell.innerHTML = `
                <a href="${deploymentUrl}" target="_blank" class="deploy-link">
                    <i class="fas fa-rocket"></i> Visit & Explore
                </a>
            `;
        } else {
            cell.innerHTML = `<span class="no-link">No link found</span>`;
        }
    }
});
