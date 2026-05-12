/**
 * Logic for the Bulk GitHub Profile Analyzer feature.
 * Analyzes up to 100 GitHub profiles, computes a quality score, and ranks them.
 */

document.addEventListener('DOMContentLoaded', () => {
    const analyzeBulkBtn = document.getElementById('analyze-bulk-btn');
    const bulkProfilesInput = document.getElementById('bulk-profiles-input');
    const bulkDashboard = document.getElementById('bulk-dashboard');
    const heroSection = document.getElementById('home');
    const dashboardSection = document.getElementById('dashboard'); 
    const profileDashboard = document.getElementById('profile-dashboard');
    const bulkReposBody = document.getElementById('bulk-repos-body');
    const bulkLeaderboardCount = document.getElementById('bulk-leaderboard-count');

    if (!analyzeBulkBtn || !bulkProfilesInput) {
        console.warn('Bulk analyzer: required DOM elements not found.');
        return;
    }

    analyzeBulkBtn.addEventListener('click', handleBulkAnalysis);

    async function handleBulkAnalysis() {
        const rawInput = bulkProfilesInput.value;
        const usernames = parseProfilesInput(rawInput);

        if (usernames.length === 0) {
            alert('Please enter at least one valid GitHub username or profile URL.');
            return;
        }

        if (usernames.length > 100) {
            alert('You can only analyze up to 100 profiles at a time. Truncating to the first 100.');
            usernames.length = 100;
        }

        if (window.showLoading) window.showLoading(`Analyzing ${usernames.length} profiles... This may take a moment.`);

        try {
            const profilesData = await fetchAllProfilesData(usernames);
            
            // Filter out invalid profiles (those that threw errors or had no repos)
            const validProfiles = profilesData.filter(p => p && p.repos);

            // Compute scores
            validProfiles.forEach(profile => {
                profile.score = calculateProfileScore(profile.repos);
            });

            // Rank profiles (descending by score)
            validProfiles.sort((a, b) => b.score - a.score);

            // Update UI
            if (bulkLeaderboardCount) {
                bulkLeaderboardCount.innerHTML = `<i class="fas fa-users"></i> Ranked ${validProfiles.length} Profiles`;
            }

            renderLeaderboard(validProfiles);

            // Switch UI sections
            if (heroSection) heroSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (profileDashboard) profileDashboard.classList.add('hidden');
            if (bulkDashboard) bulkDashboard.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert(`An error occurred during bulk analysis: ${error.message}`);
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }

    function parseProfilesInput(input) {
        // Replace commas and newlines with spaces, then split by whitespace
        const tokens = input.replace(/,/g, ' ').replace(/\n/g, ' ').split(/\s+/);
        const usernames = new Set();
        
        for (let token of tokens) {
            token = token.trim();
            if (!token) continue;
            
            // Extract username from URL or plain string
            let username = extractProfileInfo(token);
            if (username) {
                usernames.add(username.toLowerCase());
            }
        }
        
        return Array.from(usernames);
    }

    async function fetchAllProfilesData(usernames) {
        const results = [];
        // Concurrency limit to avoid overwhelming the proxy/GitHub API
        const CONCURRENCY_LIMIT = 5;
        
        for (let i = 0; i < usernames.length; i += CONCURRENCY_LIMIT) {
            const chunk = usernames.slice(i, i + CONCURRENCY_LIMIT);
            const chunkPromises = chunk.map(async (username) => {
                try {
                    // Try to fetch repositories
                    const repos = await fetchUserRepositories(username);
                    if (Array.isArray(repos)) {
                        return { username, repos };
                    }
                } catch (err) {
                    console.warn(`Failed to fetch repos for ${username}:`, err);
                }
                return null;
            });
            
            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }
        
        return results;
    }

    function calculateProfileScore(repos) {
        if (!repos || repos.length === 0) return 0;

        let totalStars = 0;
        let totalForks = 0;
        let deployments = 0;
        let descriptions = 0;
        let languages = new Set();
        let totalActivityScore = 0;

        const now = new Date();

        repos.forEach(repo => {
            totalStars += repo.stargazers_count || 0;
            totalForks += repo.forks_count || 0;
            
            if (repo.homepage || (repo.description && repo.description.match(/https?:\/\/[^\s]+/))) {
                deployments++;
            }
            if (repo.description && repo.description.length > 20) {
                descriptions++;
            }
            if (repo.language) {
                languages.add(repo.language);
            }

            // Activity score: more recent updates = higher score
            const daysSinceUpdate = (now - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24);
            const activityScore = Math.max(0, 1 - (daysSinceUpdate / 365));
            totalActivityScore += activityScore;
        });

        // Compute metrics
        const numRepos = repos.length;
        const avgStars = totalStars / numRepos;
        const techDiversity = languages.size;
        const activeReposRatio = totalActivityScore / numRepos;
        const deploymentRatio = deployments / numRepos;
        const documentationRatio = descriptions / numRepos;

        // Weights:
        // Volume: 10%
        // Popularity (Avg Stars): 30%
        // Tech Diversity: 15%
        // Activity/Freshness: 15%
        // Deployments: 15%
        // Quality (Descriptions/Docs): 15%

        const score = 
            (Math.min(numRepos, 50) / 50 * 10) + 
            (Math.log(1 + avgStars) * 10) + // Cap average impact logarithmically, multiply for weight
            (Math.min(techDiversity, 10) / 10 * 15) + 
            (activeReposRatio * 15) + 
            (deploymentRatio * 15) + 
            (documentationRatio * 15);

        return Math.min(100, Math.max(0, score * 1.5)); // Scale up and cap at 100
    }

    function renderLeaderboard(profiles) {
        if (!bulkReposBody) return;
        bulkReposBody.innerHTML = '';

        profiles.forEach((profile, index) => {
            const tr = document.createElement('tr');
            
            let totalStars = profile.repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
            
            // Find top language
            const langCounts = {};
            profile.repos.forEach(r => {
                if (r.language) {
                    langCounts[r.language] = (langCounts[r.language] || 0) + 1;
                }
            });
            const topLang = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a])[0] || 'N/A';

            tr.innerHTML = `
                <td>
                    <span class="rank-badge rank-${index + 1}">${index + 1}</span>
                </td>
                <td>
                    <a href="https://github.com/${profile.username}" target="_blank" class="repo-link" style="font-size: 1.1rem; font-weight: bold;">
                        @${profile.username}
                    </a>
                    <p style="font-size: 0.8rem; margin: 4px 0 0; color: var(--text-muted);">
                        ${profile.repos.length} Repositories
                    </p>
                </td>
                <td>
                    <span class="star-badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 4px;">
                        <i class="fas fa-star"></i> ${totalStars}
                    </span>
                </td>
                <td>
                    <span style="font-size: 0.9rem; color: var(--text-color);">${topLang}</span>
                </td>
                <td>
                    <div class="score-bar-container">
                        <div class="score-bar" style="width: ${profile.score}%"></div>
                    </div>
                    <span style="font-weight: bold; margin-left: 8px;">${profile.score.toFixed(1)}</span>
                </td>
            `;
            bulkReposBody.appendChild(tr);
        });
    }
});
