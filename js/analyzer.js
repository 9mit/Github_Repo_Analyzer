/**
 * Generates a comprehensive analysis report for the repository.
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @param {Array<object>} structure - The flat file structure list.
 * @returns {string} - The generated analysis in Markdown format.
 */
function generateAnalysisReport(repoData, languages, structure) {
    const languageList = Object.keys(languages).join(', ');

    let report = `# Analysis Report for ${repoData.name}\n\n`;
    report += `**Owner:** [${repoData.owner.login}](${repoData.owner.html_url})\n`;
    report += `**Description:** ${repoData.description || 'No description provided.'}\n\n`;

    report += `## Technology Stack\n`;
    report += `The primary languages used in this repository are: **${languageList}**.\n\n`;
    
    report += `## Project Structure Overview\n`;
    const totalFiles = structure.length;
    const directories = new Set(structure.map(f => f.path.substring(0, f.path.lastIndexOf('/'))));
    report += `The repository contains **${totalFiles} files** across **${directories.size} directories**.\n\n`;

    report += `### Key Files Detected:\n`;
    report += `- **Package Management:** ${structure.some(f => f.path.includes('package.json')) ? '`package.json` found.' : 'Not found.'}\n`;
    report += `- **Build/CI:** ${structure.some(f => f.path.includes('.github')) ? 'GitHub Actions workflow found.' : 'No CI configuration found.'}\n`;
    report += `- **License:** ${repoData.license ? `\`${repoData.license.name}\` found.` : 'No license file detected.'}\n\n`;

    report += `## Recommendations\n`;
    report += `- **Documentation:** ${!structure.some(f => f.path.toLowerCase().includes('readme')) ? 'Consider adding a README.md to explain the project.' : 'README exists. Ensure it is up-to-date.'}\n`;
    report += `- **Contributing Guide:** ${!structure.some(f => f.path.toLowerCase().includes('contributing')) ? 'Add a `CONTRIBUTING.md` to guide new contributors.' : 'Contribution guide found.'}\n`;
    
    return report;
}

/**
 * Generates an improved README file content.
 * @param {object} repoData - The main repository data.
 * @param {object} languages - The language breakdown.
 * @returns {string} - The generated README in Markdown format.
 */
function generateImprovedReadme(repoData, languages) {
    const languageBadges = Object.keys(languages).map(lang => 
        `![Language](https://img.shields.io/badge/${lang.replace(/ /g, '%20')}-blue.svg)`
    ).join(' ');

    let readme = `# ${repoData.name}\n\n`;
    readme += `${languageBadges}\n\n`;
    readme += `> ${repoData.description || 'A brief description of the project.'}\n\n`;
    
    readme += `## Features\n\n`;
    readme += `- Feature 1\n- Feature 2\n- Feature 3\n\n`;
    
    readme += `## Tech Stack\n\n`;
    readme += `**Client:** Framework (e.g., React, Vue, Angular)\n`;
    readme += `**Server:** Framework (e.g., Node, Django, Rails)\n\n`;
    
    readme += `## Installation\n\n`;
    readme += `Clone the repository and install dependencies:\n`;
    readme += "```bash\n";
    readme += `git clone ${repoData.clone_url}\n`;
    readme += `cd ${repoData.name}\n`;
    readme += `# Add installation commands here (e.g., npm install)\n`;
    readme += "```\n\n";

    readme += `## License\n\n`;
    readme += `This project is licensed under the ${repoData.license ? repoData.license.name : 'MIT'} License.\n`;

    return readme;
}