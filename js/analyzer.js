/**
 * Enhanced Analyzer - Smart Code-Based Analysis Engine
 * Generates intelligent README and Analysis reports using pattern detection
 */

// ============================================================================
// PATTERN DETECTION ENGINE
// ============================================================================

/**
 * Comprehensive framework and library detection patterns
 */
const FRAMEWORK_PATTERNS = {
    // JavaScript/TypeScript Frameworks
    'React': { deps: ['react', 'react-dom'], files: ['App.jsx', 'App.tsx'] },
    'Next.js': { deps: ['next'], files: ['next.config.js', 'pages/_app.js'] },
    'Vue.js': { deps: ['vue'], files: ['vue.config.js', 'nuxt.config.js'] },
    'Angular': { deps: ['@angular/core'], files: ['angular.json'] },
    'Svelte': { deps: ['svelte'], files: ['svelte.config.js'] },
    'Express.js': { deps: ['express'], files: [] },
    'NestJS': { deps: ['@nestjs/core'], files: ['nest-cli.json'] },
    'Fastify': { deps: ['fastify'], files: [] },

    // Python Frameworks
    'Django': { deps: [], files: ['manage.py', 'settings.py'] },
    'Flask': { deps: [], files: ['app.py', 'wsgi.py'] },
    'FastAPI': { deps: [], files: [] },

    // Build Tools
    'Vite': { deps: ['vite'], files: ['vite.config.js', 'vite.config.ts'] },
    'Webpack': { deps: ['webpack'], files: ['webpack.config.js'] },
    'Rollup': { deps: ['rollup'], files: ['rollup.config.js'] },
    'Parcel': { deps: ['parcel'], files: [] },

    // CSS Frameworks
    'Tailwind CSS': { deps: ['tailwindcss'], files: ['tailwind.config.js'] },
    'Bootstrap': { deps: ['bootstrap'], files: [] },
    'Material UI': { deps: ['@mui/material', '@material-ui/core'], files: [] },
    'Styled Components': { deps: ['styled-components'], files: [] },

    // Testing
    'Jest': { deps: ['jest'], files: ['jest.config.js'] },
    'Mocha': { deps: ['mocha'], files: [] },
    'Vitest': { deps: ['vitest'], files: [] },
    'Cypress': { deps: ['cypress'], files: ['cypress.config.js'] },
    'Playwright': { deps: ['@playwright/test'], files: ['playwright.config.js'] },

    // State Management
    'Redux': { deps: ['redux', '@reduxjs/toolkit'], files: [] },
    'Zustand': { deps: ['zustand'], files: [] },
    'MobX': { deps: ['mobx'], files: [] },

    // Database & ORM
    'Prisma': { deps: ['@prisma/client'], files: ['prisma/schema.prisma'] },
    'Mongoose': { deps: ['mongoose'], files: [] },
    'TypeORM': { deps: ['typeorm'], files: [] },
    'Sequelize': { deps: ['sequelize'], files: [] },
};

/**
 * Project type detection based on file patterns
 */
const PROJECT_TYPE_INDICATORS = {
    'Web Application': {
        files: ['index.html', 'App.jsx', 'App.tsx', 'App.vue'],
        dirs: ['src/pages', 'src/views', 'src/components']
    },
    'API/Backend': {
        files: ['server.js', 'app.py', 'main.go', 'Dockerfile'],
        dirs: ['routes', 'controllers', 'middleware', 'api']
    },
    'CLI Tool': {
        files: ['cli.js', 'bin/cli', 'setup.py'],
        dirs: ['bin', 'commands']
    },
    'Library/Package': {
        files: ['index.js', 'lib/index.js', 'src/index.ts'],
        dirs: ['lib', 'dist']
    },
    'Mobile App': {
        files: ['App.native.js', 'app.json'],
        dirs: ['ios', 'android']
    },
    'Desktop App': {
        files: ['electron.js', 'main.ts'],
        deps: ['electron', 'tauri']
    },
    'Documentation': {
        files: ['mkdocs.yml', 'docusaurus.config.js'],
        dirs: ['docs']
    },
    'Monorepo': {
        files: ['lerna.json', 'pnpm-workspace.yaml', 'turbo.json'],
        dirs: ['packages', 'apps']
    }
};

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parses package.json content to extract meaningful data.
 * @param {string|null} content - The string content of package.json.
 * @returns {object} - An object with dependencies, devDependencies, scripts, etc.
 */
function parsePackageJson(content) {
    if (!content) return {};
    try {
        const data = JSON.parse(content);
        return {
            name: data.name,
            version: data.version,
            description: data.description,
            main: data.main,
            type: data.type,
            author: data.author,
            license: data.license,
            homepage: data.homepage,
            repository: data.repository,
            keywords: data.keywords || [],
            dependencies: data.dependencies ? Object.keys(data.dependencies) : [],
            devDependencies: data.devDependencies ? Object.keys(data.devDependencies) : [],
            peerDependencies: data.peerDependencies ? Object.keys(data.peerDependencies) : [],
            allDeps: {
                ...data.dependencies,
                ...data.devDependencies
            },
            scripts: data.scripts || {},
            engines: data.engines || {}
        };
    } catch (e) {
        console.error("Error parsing package.json:", e);
        return {};
    }
}

/**
 * Parses requirements.txt content for Python projects
 * @param {string} content - The content of requirements.txt
 * @returns {Array<{name: string, version: string}>}
 */
function parseRequirementsTxt(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const deps = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const match = trimmed.match(/^([a-zA-Z0-9\-_]+)(.*)?$/);
        if (match) {
            deps.push({
                name: match[1],
                version: match[2] ? match[2].trim() : 'latest'
            });
        }
    }
    return deps;
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects frameworks and libraries used in the project
 * @param {object} pkg - Parsed package.json
 * @param {Array<object>} structure - File structure
 * @returns {Array<{name: string, type: string, confidence: string}>}
 */
function detectFrameworks(pkg, structure) {
    const detected = [];
    const allDeps = [...(pkg.dependencies || []), ...(pkg.devDependencies || [])];
    const filePaths = structure.map(f => f.path.toLowerCase());

    for (const [name, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
        let matched = false;
        let matchType = '';

        // Check dependencies
        if (patterns.deps && patterns.deps.some(dep => allDeps.includes(dep))) {
            matched = true;
            matchType = 'dependency';
        }

        // Check file patterns
        if (!matched && patterns.files && patterns.files.length > 0) {
            if (patterns.files.some(file => filePaths.some(fp => fp.endsWith(file.toLowerCase())))) {
                matched = true;
                matchType = 'file pattern';
            }
        }

        if (matched) {
            detected.push({ name, matchType, confidence: 'high' });
        }
    }

    return detected;
}

/**
 * Detects project type based on file structure
 * @param {object} pkg - Parsed package.json
 * @param {Array<object>} structure - File structure
 * @returns {string}
 */
function detectProjectType(pkg, structure) {
    const filePaths = structure.map(f => f.path.toLowerCase());
    const scores = {};

    for (const [type, indicators] of Object.entries(PROJECT_TYPE_INDICATORS)) {
        scores[type] = 0;

        if (indicators.files) {
            for (const file of indicators.files) {
                if (filePaths.some(fp => fp.endsWith(file.toLowerCase()))) {
                    scores[type] += 2;
                }
            }
        }

        if (indicators.dirs) {
            for (const dir of indicators.dirs) {
                if (filePaths.some(fp => fp.includes(dir.toLowerCase() + '/'))) {
                    scores[type] += 1;
                }
            }
        }

        if (indicators.deps && pkg.dependencies) {
            for (const dep of indicators.deps) {
                if (pkg.dependencies.includes(dep)) {
                    scores[type] += 3;
                }
            }
        }
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'General Purpose Project';

    return Object.entries(scores).find(([_, score]) => score === maxScore)[0];
}

/**
 * Infers potential features from the file structure by looking at common directories.
 * @param {Array<object>} structure - The flat file structure list.
 * @returns {Array<string>} - A list of inferred feature names.
 */
function inferFeatures(structure) {
    const features = new Set();
    const featureDirs = ['components', 'pages', 'views', 'features', 'containers', 'modules', 'screens'];

    structure.forEach(file => {
        if (file.type !== 'blob') return;
        const pathParts = file.path.split('/');

        // Look for files in feature directories
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (featureDirs.includes(pathParts[i].toLowerCase())) {
                const featurePath = pathParts[i + 1];
                // Skip index files
                if (featurePath && !featurePath.toLowerCase().includes('index')) {
                    let featureName = featurePath.replace(/\.(js|jsx|ts|tsx|vue|svelte)$/, '');
                    // Convert camelCase/PascalCase to readable format
                    featureName = featureName.replace(/([A-Z])/g, ' $1').trim();
                    featureName = featureName.charAt(0).toUpperCase() + featureName.slice(1);
                    features.add(featureName);
                }
            }
        }
    });

    return Array.from(features).slice(0, 8);
}

/**
 * Analyzes code quality indicators
 * @param {Array<object>} structure - File structure
 * @param {object} pkg - Parsed package.json
 * @returns {object}
 */
function analyzeCodeQuality(structure, pkg) {
    const filePaths = structure.map(f => f.path.toLowerCase());
    const indicators = {
        hasTests: false,
        hasCI: false,
        hasLinting: false,
        hasTypeScript: false,
        hasDocumentation: false,
        hasSecurity: false,
        hasContributing: false,
        hasChangelog: false,
        hasGitignore: false,
        hasEnvExample: false
    };

    // File-based checks
    indicators.hasTests = filePaths.some(f =>
        f.includes('test') || f.includes('spec') || f.includes('__tests__')
    );
    indicators.hasCI = filePaths.some(f =>
        f.includes('.github/workflows') || f.includes('.gitlab-ci') || f.includes('circleci')
    );
    indicators.hasTypeScript = filePaths.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    indicators.hasDocumentation = filePaths.some(f => f.includes('/docs/') || f.includes('documentation'));
    indicators.hasContributing = filePaths.some(f => f.includes('contributing'));
    indicators.hasChangelog = filePaths.some(f => f.includes('changelog'));
    indicators.hasGitignore = filePaths.some(f => f === '.gitignore');
    indicators.hasEnvExample = filePaths.some(f => f.includes('.env.example') || f.includes('.env.template'));

    // Dependency-based checks
    const allDeps = [...(pkg.dependencies || []), ...(pkg.devDependencies || [])];
    indicators.hasLinting = allDeps.some(d =>
        ['eslint', 'prettier', 'tslint', 'biome'].includes(d)
    );
    indicators.hasSecurity = allDeps.some(d =>
        ['helmet', 'cors', 'bcrypt', 'jsonwebtoken'].includes(d)
    );

    return indicators;
}

/**
 * Calculates file statistics
 * @param {Array<object>} structure - File structure
 * @param {object} languages - Language breakdown
 * @returns {object}
 */
function calculateFileStats(structure, languages) {
    const files = structure.filter(f => f.type === 'blob');
    const directories = new Set();
    const extensions = {};

    files.forEach(file => {
        // Track directories
        const dir = file.path.substring(0, file.path.lastIndexOf('/'));
        if (dir) directories.add(dir);

        // Track extensions
        const ext = file.path.split('.').pop();
        if (ext && ext !== file.path) {
            extensions[ext] = (extensions[ext] || 0) + 1;
        }
    });

    // Sort extensions by count
    const sortedExtensions = Object.entries(extensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return {
        totalFiles: files.length,
        totalDirectories: directories.size,
        extensions: Object.fromEntries(sortedExtensions),
        topLanguages: Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
    };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generates a comprehensive analysis report
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @param {Array<object>} structure - The flat file structure list.
 * @param {string|null} packageJsonContent - The content of package.json, if it exists.
 * @returns {string} - The generated analysis in Markdown format.
 */
function generateSmartAnalysisReport(repoData, languages, structure, packageJsonContent) {
    const pkg = parsePackageJson(packageJsonContent);
    const frameworks = detectFrameworks(pkg, structure);
    const projectType = detectProjectType(pkg, structure);
    const codeQuality = analyzeCodeQuality(structure, pkg);
    const stats = calculateFileStats(structure, languages);

    let report = `# 🔍 Smart Analysis: ${repoData.name}\n\n`;

    // Header with key metrics
    report += `| Metric | Value |\n|--------|-------|\n`;
    report += `| **Owner** | [${repoData.owner.login}](${repoData.owner.html_url}) |\n`;
    report += `| **Stars** | ⭐ ${repoData.stargazers_count.toLocaleString()} |\n`;
    report += `| **Forks** | 🍴 ${repoData.forks_count.toLocaleString()} |\n`;
    report += `| **Project Type** | ${projectType} |\n`;
    report += `| **Primary Language** | ${repoData.language || 'N/A'} |\n\n`;

    // Description
    report += `> ${repoData.description || pkg.description || 'No description provided.'}\n\n`;

    // Technology Stack
    report += `## 🛠️ Technology Stack\n\n`;

    if (frameworks.length > 0) {
        report += `### Detected Frameworks & Libraries\n\n`;
        frameworks.forEach(fw => {
            report += `- **${fw.name}** _(detected via ${fw.matchType})_\n`;
        });
        report += '\n';
    }

    if (stats.topLanguages.length > 0) {
        report += `### Language Distribution\n\n`;
        const totalBytes = stats.topLanguages.reduce((acc, [_, bytes]) => acc + bytes, 0);
        stats.topLanguages.forEach(([lang, bytes]) => {
            const percentage = ((bytes / totalBytes) * 100).toFixed(1);
            report += `- **${lang}**: ${percentage}%\n`;
        });
        report += '\n';
    }

    // Dependencies Analysis
    if (pkg.dependencies && pkg.dependencies.length > 0) {
        report += `## 📦 Dependencies\n\n`;

        report += `### Production Dependencies (${pkg.dependencies.length})\n\n`;
        const prodDeps = pkg.dependencies.slice(0, 10);
        prodDeps.forEach(dep => report += `- \`${dep}\`\n`);
        if (pkg.dependencies.length > 10) {
            report += `- _...and ${pkg.dependencies.length - 10} more_\n`;
        }
        report += '\n';

        if (pkg.devDependencies && pkg.devDependencies.length > 0) {
            report += `### Development Dependencies (${pkg.devDependencies.length})\n\n`;
            const devDeps = pkg.devDependencies.slice(0, 10);
            devDeps.forEach(dep => report += `- \`${dep}\`\n`);
            if (pkg.devDependencies.length > 10) {
                report += `- _...and ${pkg.devDependencies.length - 10} more_\n`;
            }
            report += '\n';
        }
    }

    // File Structure Analysis
    report += `## 📁 Project Structure\n\n`;
    report += `The repository contains **${stats.totalFiles} files** across **${stats.totalDirectories} directories**.\n\n`;

    if (Object.keys(stats.extensions).length > 0) {
        report += `### File Types\n\n`;
        Object.entries(stats.extensions).forEach(([ext, count]) => {
            report += `- \`.${ext}\`: ${count} files\n`;
        });
        report += '\n';
    }

    // Code Quality Assessment
    report += `## ✅ Code Quality Assessment\n\n`;
    const qualityScore = Object.values(codeQuality).filter(v => v).length;
    const qualityEmoji = qualityScore >= 7 ? '🌟' : qualityScore >= 4 ? '👍' : '⚠️';
    report += `**Score: ${qualityScore}/10** ${qualityEmoji}\n\n`;

    report += `| Indicator | Status |\n|-----------|--------|\n`;
    report += `| Testing | ${codeQuality.hasTests ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| CI/CD | ${codeQuality.hasCI ? '✅ Configured' : '❌ Not found'} |\n`;
    report += `| TypeScript | ${codeQuality.hasTypeScript ? '✅ Used' : '➖ Not used'} |\n`;
    report += `| Linting | ${codeQuality.hasLinting ? '✅ Configured' : '❌ Missing'} |\n`;
    report += `| Documentation | ${codeQuality.hasDocumentation ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| Contributing Guide | ${codeQuality.hasContributing ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| Changelog | ${codeQuality.hasChangelog ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| .gitignore | ${codeQuality.hasGitignore ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| Environment Example | ${codeQuality.hasEnvExample ? '✅ Present' : '❌ Missing'} |\n`;
    report += `| Security Headers | ${codeQuality.hasSecurity ? '✅ Implemented' : '➖ Not detected'} |\n\n`;

    // Recommendations
    report += `## 💡 Recommendations\n\n`;
    const recommendations = [];

    if (!repoData.license) {
        recommendations.push('**Add a License**: Protect your work and clarify how others can use it by adding a `LICENSE` file.');
    }
    if (!codeQuality.hasTests) {
        recommendations.push('**Add Testing**: Implementing tests would improve code reliability and make contributions safer.');
    }
    if (!codeQuality.hasCI) {
        recommendations.push('**Set up CI/CD**: Automate testing and deployment with GitHub Actions or similar.');
    }
    if (!codeQuality.hasContributing) {
        recommendations.push('**Create Contributing Guide**: A `CONTRIBUTING.md` encourages community involvement.');
    }
    if (!codeQuality.hasLinting) {
        recommendations.push('**Add Linting**: Configure ESLint or Prettier for consistent code style.');
    }
    if (!codeQuality.hasEnvExample) {
        recommendations.push('**Add .env.example**: Help developers set up by documenting required environment variables.');
    }
    if (!codeQuality.hasGitignore) {
        recommendations.push('**Add .gitignore**: Prevent committing unnecessary files.');
    }

    if (recommendations.length > 0) {
        recommendations.forEach(rec => report += `- ${rec}\n`);
    } else {
        report += '🎉 This repository follows excellent practices!\n';
    }

    // Scripts
    if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
        report += `\n## 📜 Available Scripts\n\n`;
        Object.entries(pkg.scripts).forEach(([name, cmd]) => {
            report += `- \`npm run ${name}\`: \`${cmd}\`\n`;
        });
    }

    report += `\n---\n_Analysis generated by CodeBuddy on ${new Date().toLocaleDateString()}_\n`;

    return report;
}

/**
 * Generates a professional README
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @param {Array<object>} structure - The flat file structure list.
 * @param {string|null} packageJsonContent - The content of package.json, if it exists.
 * @returns {string} - The generated README in Markdown format.
 */
function generateSmartReadme(repoData, languages, structure, packageJsonContent) {
    const pkg = parsePackageJson(packageJsonContent);
    const frameworks = detectFrameworks(pkg, structure);
    const projectType = detectProjectType(pkg, structure);
    const features = inferFeatures(structure);

    let readme = '';

    // Title with badges
    readme += `# ${pkg.name || repoData.name}\n\n`;

    // Badges
    readme += `![GitHub stars](https://img.shields.io/github/stars/${repoData.owner.login}/${repoData.name}?style=for-the-badge) `;
    readme += `![GitHub forks](https://img.shields.io/github/forks/${repoData.owner.login}/${repoData.name}?style=for-the-badge) `;
    if (repoData.license) {
        readme += `![License](https://img.shields.io/github/license/${repoData.owner.login}/${repoData.name}?style=for-the-badge) `;
    }
    if (repoData.language) {
        readme += `![Top Language](https://img.shields.io/github/languages/top/${repoData.owner.login}/${repoData.name}?style=for-the-badge) `;
    }
    readme += '\n\n';

    // Description
    readme += `> ${repoData.description || pkg.description || 'A brief description of your project.'}\n\n`;

    // Table of Contents
    readme += `## 📋 Table of Contents\n\n`;
    readme += `- [Features](#-features)\n`;
    readme += `- [Tech Stack](#-tech-stack)\n`;
    readme += `- [Installation](#-installation)\n`;
    readme += `- [Usage](#-usage)\n`;
    readme += `- [Contributing](#-contributing)\n`;
    readme += `- [License](#-license)\n\n`;

    // Features
    readme += `## ✨ Features\n\n`;
    if (features.length > 0) {
        features.forEach(f => {
            readme += `- **${f}** - Add description here\n`;
        });
    } else {
        readme += `- Feature 1 - Add description\n`;
        readme += `- Feature 2 - Add description\n`;
        readme += `- Feature 3 - Add description\n`;
    }
    readme += '\n';

    // Tech Stack
    readme += `## 🛠️ Tech Stack\n\n`;
    const techStack = new Set();

    // Add languages
    Object.keys(languages).forEach(lang => techStack.add(lang));

    // Add frameworks
    frameworks.forEach(fw => techStack.add(fw.name));

    if (techStack.size > 0) {
        Array.from(techStack).slice(0, 10).forEach(tech => {
            readme += `- ${tech}\n`;
        });
    } else {
        readme += `_Add your technologies here_\n`;
    }
    readme += '\n';

    // Installation
    readme += `## 🚀 Installation\n\n`;
    readme += `### Prerequisites\n\n`;

    if (pkg.engines) {
        if (pkg.engines.node) readme += `- Node.js ${pkg.engines.node}\n`;
        if (pkg.engines.npm) readme += `- npm ${pkg.engines.npm}\n`;
    } else if (pkg.name) {
        readme += `- Node.js (v16 or higher recommended)\n`;
        readme += `- npm or yarn\n`;
    }
    const hasPython = Object.keys(languages).some(l => l.toLowerCase() === 'python');
    if (hasPython) {
        readme += `- Python 3.8+\n`;
        readme += `- pip\n`;
    }
    readme += '\n';

    readme += `### Steps\n\n`;
    readme += `1. Clone the repository:\n`;
    readme += `\`\`\`bash\ngit clone ${repoData.clone_url}\ncd ${repoData.name}\n\`\`\`\n\n`;

    if (pkg.name) {
        readme += `2. Install dependencies:\n`;
        readme += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
    } else if (structure.some(f => f.path.toLowerCase() === 'requirements.txt')) {
        readme += `2. Install dependencies:\n`;
        readme += `\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n`;
    }

    if (structure.some(f => f.path.toLowerCase().includes('.env'))) {
        readme += `3. Set up environment variables:\n`;
        readme += `\`\`\`bash\ncp .env.example .env\n# Edit .env with your configuration\n\`\`\`\n\n`;
    }

    // Usage
    readme += `## 📖 Usage\n\n`;
    if (pkg.scripts) {
        if (pkg.scripts.dev) {
            readme += `### Development\n\n`;
            readme += `\`\`\`bash\nnpm run dev\n\`\`\`\n\n`;
        }
        if (pkg.scripts.start) {
            readme += `### Production\n\n`;
            readme += `\`\`\`bash\nnpm start\n\`\`\`\n\n`;
        }
        if (pkg.scripts.build) {
            readme += `### Build\n\n`;
            readme += `\`\`\`bash\nnpm run build\n\`\`\`\n\n`;
        }
        if (pkg.scripts.test) {
            readme += `### Testing\n\n`;
            readme += `\`\`\`bash\nnpm test\n\`\`\`\n\n`;
        }
    } else {
        readme += `\`\`\`bash\n# Add usage instructions here\n\`\`\`\n\n`;
    }

    // Contributing
    readme += `## 🤝 Contributing\n\n`;
    readme += `Contributions are welcome! Please feel free to submit a Pull Request.\n\n`;
    readme += `1. Fork the repository\n`;
    readme += `2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)\n`;
    readme += `3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)\n`;
    readme += `4. Push to the branch (\`git push origin feature/AmazingFeature\`)\n`;
    readme += `5. Open a Pull Request\n\n`;

    // License
    readme += `## 📄 License\n\n`;
    if (repoData.license) {
        readme += `This project is licensed under the [${repoData.license.name}](LICENSE).\n\n`;
    } else {
        readme += `This project is open source and available under the [MIT License](LICENSE).\n\n`;
    }

    // Footer
    readme += `---\n\n`;
    readme += `<p align="center">`;
    readme += `Made with ❤️ by <a href="${repoData.owner.html_url}">${repoData.owner.login}</a>`;
    readme += `</p>\n`;

    return readme;
}
