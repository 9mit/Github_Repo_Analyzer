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
            dependencies: data.dependencies ? Object.keys(data.dependencies) : [],
            devDependencies: data.devDependencies ? Object.keys(data.devDependencies) : [],
            scripts: data.scripts || {}
        };
    } catch (e) {
        console.error("Error parsing package.json:", e);
        return {};
    }
}

/**
 * Infers potential features from the file structure by looking at common directories.
 * @param {Array<object>} structure - The flat file structure list.
 * @returns {Array<string>} - A list of inferred feature names.
 */
function inferFeatures(structure) {
    const features = new Set();
    const commonFeatureDirs = ['components', 'pages', 'views', 'features', 'containers', 'src/api'];
    
    structure.forEach(file => {
        const pathParts = file.path.split('/');
        
        const inFeatureDir = pathParts.some((part, index) => {
            const parentPath = pathParts.slice(0, index).join('/').toLowerCase();
            return commonFeatureDirs.includes(part.toLowerCase()) || commonFeatureDirs.includes(parentPath);
        });

        if (inFeatureDir) {
            let featureName = pathParts.pop().replace(/\.(js|jsx|ts|tsx|vue|svelte)$/, '');
            if (featureName.toLowerCase() !== 'index' && featureName.toLowerCase() !== 'app') {
                featureName = featureName.replace(/([A-Z])/g, ' $1').trim(); // Add space before caps
                features.add(featureName.charAt(0).toUpperCase() + featureName.slice(1));
            }
        }
    });
    return Array.from(features).slice(0, 5); // Limit for brevity
}

/**
 * Generates a "smart" analysis report by deeply analyzing the repo structure.
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @param {Array<object>} structure - The flat file structure list.
 * @param {string|null} packageJsonContent - The content of package.json, if it exists.
 * @returns {string} - The generated analysis in Markdown format.
 */
function generateSmartAnalysisReport(repoData, languages, structure, packageJsonContent) {
    const pkg = parsePackageJson(packageJsonContent);
    const languageList = Object.keys(languages).join(', ');

    let report = `# Smart Analysis for ${repoData.name}\n\n`;
    report += `**Owner:** [${repoData.owner.login}](${repoData.owner.html_url})\n`;
    report += `**Description:** ${repoData.description || pkg.description || 'No description provided.'}\n\n`;
    report += `Based on the repository's structure and metadata, here is a deeper analysis of the project.\n\n`;

    report += `## Technology Stack & Purpose\n`;
    report += `The primary languages used are **${languageList}**. `;

    let purpose = "a general purpose project";
    if (pkg.dependencies?.includes('react')) purpose = "a **React** web application";
    else if (pkg.dependencies?.includes('vue')) purpose = "a **Vue.js** web application";
    else if (pkg.dependencies?.includes('angular')) purpose = "an **Angular** web application";
    else if (pkg.dependencies?.includes('express')) purpose = "a **Node.js/Express** server";
    else if (structure.some(f => f.path.toLowerCase().endsWith('.py'))) purpose = "a **Python** application or script";
    
    report += `This appears to be ${purpose}.\n\n`;

    if (pkg.dependencies?.length > 0) {
        report += `### Key Dependencies:\n`;
        report += `_These packages are central to the project's functionality._\n`;
        report += pkg.dependencies.slice(0, 5).map(d => `- \`${d}\``).join('\n') + '\n\n';
    }
    if (pkg.devDependencies?.length > 0) {
        report += `### Development & Build Tools:\n`;
        report += `_These tools are used for development, testing, and bundling._\n`;
        report += pkg.devDependencies.slice(0, 5).map(d => `- \`${d}\``).join('\n') + '\n\n';
    }
    
    report += `## Project Structure Overview\n`;
    const directories = new Set(structure.map(f => f.path.substring(0, f.path.lastIndexOf('/'))).filter(p => p));
    report += `The repository contains **${structure.length} files** across **${directories.size} directories**.\n\n`;

    report += `### Structural Analysis:\n`;
    let structuralNotes = [];
    if (structure.some(f => f.path.startsWith('src/'))) structuralNotes.push("A standard \`src\` directory is used, indicating a clear separation between source code and configuration files.");
    if (structure.some(f => f.path.startsWith('.github/'))) structuralNotes.push("A \`.github\` directory is present, suggesting the use of GitHub Actions for CI/CD or other automations.");
    if (pkg.name) structuralNotes.push("A \`package.json\` file defines project metadata and dependencies, typical for a JavaScript/Node.js project.");
    if (structure.some(f => f.path.toLowerCase().includes('dockerfile'))) structuralNotes.push("A \`Dockerfile\` was found, which means the application is likely designed to be containerized.");
    if (structuralNotes.length > 0) {
        report += structuralNotes.map(n => `- ${n}`).join('\n') + '\n\n';
    } else {
        report += "- The project has a flat structure, which may be suitable for smaller scripts or projects.\n\n";
    }

    report += `## Smart Recommendations\n`;
    let recommendations = [];
    if (!repoData.license) recommendations.push("**Add a License:** Protect your work and clarify how others can use it by adding a `LICENSE` file.");
    if (!structure.some(f => f.path.toLowerCase().includes('contributing'))) recommendations.push("**Create a Contributing Guide:** A `CONTRIBUTING.md` file encourages community contributions and sets clear guidelines.");
    if (pkg.name && !pkg.scripts?.test) recommendations.push("**Add Testing:** No `test` script was found in `package.json`. Implementing a testing framework (like Jest, Mocha) would improve code quality.");
    if (!structure.some(f => f.path.toLowerCase().includes('.gitignore'))) recommendations.push("**Add .gitignore:** A `.gitignore` file is crucial to prevent committing unnecessary files (like `node_modules` or `.env`) to the repository.");
    
    if (recommendations.length > 0) {
        report += recommendations.map(r => `- ${r}`).join('\n') + '\n';
    } else {
        report += "- The repository seems to follow good practices, with key files like a license and contribution guide in place.\n";
    }
    
    return report;
}

/**
 * Generates a "smart" README by analyzing the repo structure.
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @param {Array<object>} structure - The flat file structure list.
 * @param {string|null} packageJsonContent - The content of package.json, if it exists.
 * @returns {string} - The generated README in Markdown format.
 */
function generateSmartReadme(repoData, languages, structure, packageJsonContent) {
    const pkg = parsePackageJson(packageJsonContent);
    const languageBadges = Object.keys(languages).map(lang => 
        `![Language](https://img.shields.io/badge/${encodeURIComponent(lang)}-${'4f46e5'}.svg)`
    ).join(' ');

    let readme = `# ${pkg.name || repoData.name}\n\n`;
    readme += `![Stars](https://img.shields.io/github/stars/${repoData.owner.login}/${repoData.name}) `;
    readme += `![Forks](https://img.shields.io/github/forks/${repoData.owner.login}/${repoData.name}) `;
    if (repoData.license) readme += `![License](https://img.shields.io/github/license/${repoData.owner.login}/${repoData.name}) `;
    readme += `\n\n`;
    readme += `${languageBadges}\n\n`;
    readme += `> ${repoData.description || pkg.description || 'A brief description of the project.'}\n\n`;
    
    const features = inferFeatures(structure);
    if (features.length > 0) {
        readme += `## ✨ Features\n\n`;
        readme += features.map(f => `- **${f}:** Add a description here.`).join('\n') + '\n\n';
    }
    
    readme += `## 🚀 Tech Stack\n\n`;
    let techStack = new Set();
    if (pkg.dependencies?.includes('react')) techStack.add('React');
    if (pkg.dependencies?.includes('next')) techStack.add('Next.js');
    if (pkg.dependencies?.includes('vue')) techStack.add('Vue.js');
    if (pkg.dependencies?.includes('express')) techStack.add('Express.js');
    if (pkg.devDependencies?.includes('tailwindcss')) techStack.add('Tailwind CSS');
    if (pkg.devDependencies?.includes('webpack')) techStack.add('Webpack');
    if (Object.keys(languages).includes('Python')) techStack.add('Python');

    if (techStack.size > 0) {
        readme += Array.from(techStack).map(t => `- ${t}`).join('\n') + '\n\n';
    } else {
        readme += `_Key technologies will be listed here._\n\n`;
    }
    
    readme += `## 🛠️ Installation\n\n`;
    readme += `1. Clone the repository:\n`;
    readme += "```bash\n";
    readme += `git clone ${repoData.clone_url}\n`;
    readme += "```\n";
    readme += `2. Navigate to the project directory:\n`;
    readme += "```bash\n";
    readme += `cd ${repoData.name}\n`;
    readme += "```\n";
    
    if (pkg.name) {
        readme += `3. Install dependencies:\n`;
        readme += "```bash\n";
        readme += `npm install\n`;
        readme += "```\n\n";
    } else if (structure.some(f => f.path.toLowerCase().endsWith('requirements.txt'))) {
        readme += `3. Install dependencies:\n`;
        readme += "```bash\n";
        readme += `pip install -r requirements.txt\n`;
        readme += "```\n\n";
    }

    if (pkg.scripts) {
        const runScript = pkg.scripts.dev || pkg.scripts.start;
        if (runScript) {
            readme += `## 🏃‍♂️ Running the Project\n\n`;
            readme += "```bash\n";
            readme += `npm run ${pkg.scripts.dev ? 'dev' : 'start'}\n`;
            readme += "```\n\n";
        }
    }

    readme += `## 📄 License\n\n`;
    readme += `This project is licensed under the **${repoData.license ? repoData.license.name : 'Not specified'}** License.\n`;

    return readme;
}
