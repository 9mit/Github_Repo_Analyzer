/**
 * Enhanced File Viewer - Better file tree with icons and file type detection
 */

// File icon mapping based on extension
const FILE_ICONS = {
    // JavaScript/TypeScript
    'js': { icon: 'fab fa-js', color: '#f7df1e' },
    'jsx': { icon: 'fab fa-react', color: '#61dafb' },
    'ts': { icon: 'fas fa-code', color: '#3178c6' },
    'tsx': { icon: 'fab fa-react', color: '#61dafb' },
    'mjs': { icon: 'fab fa-js', color: '#f7df1e' },

    // Web
    'html': { icon: 'fab fa-html5', color: '#e34c26' },
    'htm': { icon: 'fab fa-html5', color: '#e34c26' },
    'css': { icon: 'fab fa-css3-alt', color: '#264de4' },
    'scss': { icon: 'fab fa-sass', color: '#cc6699' },
    'sass': { icon: 'fab fa-sass', color: '#cc6699' },
    'less': { icon: 'fab fa-less', color: '#1d365d' },

    // Data/Config
    'json': { icon: 'fas fa-brackets-curly', color: '#6b7280' },
    'yaml': { icon: 'fas fa-file-code', color: '#cb171e' },
    'yml': { icon: 'fas fa-file-code', color: '#cb171e' },
    'xml': { icon: 'fas fa-file-code', color: '#0060ac' },
    'toml': { icon: 'fas fa-file-code', color: '#9c4121' },

    // Python
    'py': { icon: 'fab fa-python', color: '#3776ab' },
    'pyw': { icon: 'fab fa-python', color: '#3776ab' },
    'ipynb': { icon: 'fas fa-book', color: '#f37626' },

    // Other Languages
    'go': { icon: 'fab fa-golang', color: '#00add8' },
    'rs': { icon: 'fas fa-cog', color: '#dea584' },
    'rb': { icon: 'fas fa-gem', color: '#cc342d' },
    'php': { icon: 'fab fa-php', color: '#777bb4' },
    'java': { icon: 'fab fa-java', color: '#007396' },
    'kt': { icon: 'fas fa-code', color: '#7f52ff' },
    'swift': { icon: 'fab fa-swift', color: '#f05138' },
    'c': { icon: 'fas fa-code', color: '#a8b9cc' },
    'cpp': { icon: 'fas fa-code', color: '#00599c' },
    'h': { icon: 'fas fa-code', color: '#a8b9cc' },
    'hpp': { icon: 'fas fa-code', color: '#00599c' },
    'cs': { icon: 'fas fa-code', color: '#239120' },

    // Documentation
    'md': { icon: 'fab fa-markdown', color: '#083fa1' },
    'mdx': { icon: 'fab fa-markdown', color: '#083fa1' },
    'txt': { icon: 'fas fa-file-alt', color: '#6b7280' },
    'rst': { icon: 'fas fa-file-alt', color: '#6b7280' },

    // Shell/Scripts
    'sh': { icon: 'fas fa-terminal', color: '#4eaa25' },
    'bash': { icon: 'fas fa-terminal', color: '#4eaa25' },
    'zsh': { icon: 'fas fa-terminal', color: '#4eaa25' },
    'ps1': { icon: 'fas fa-terminal', color: '#012456' },
    'bat': { icon: 'fas fa-terminal', color: '#c1f12e' },

    // DevOps
    'dockerfile': { icon: 'fab fa-docker', color: '#2496ed' },
    'docker-compose': { icon: 'fab fa-docker', color: '#2496ed' },

    // Images
    'png': { icon: 'fas fa-image', color: '#6b7280' },
    'jpg': { icon: 'fas fa-image', color: '#6b7280' },
    'jpeg': { icon: 'fas fa-image', color: '#6b7280' },
    'gif': { icon: 'fas fa-image', color: '#6b7280' },
    'svg': { icon: 'fas fa-bezier-curve', color: '#ffb13b' },
    'ico': { icon: 'fas fa-image', color: '#6b7280' },
    'webp': { icon: 'fas fa-image', color: '#6b7280' },

    // Fonts
    'woff': { icon: 'fas fa-font', color: '#6b7280' },
    'woff2': { icon: 'fas fa-font', color: '#6b7280' },
    'ttf': { icon: 'fas fa-font', color: '#6b7280' },
    'otf': { icon: 'fas fa-font', color: '#6b7280' },
    'eot': { icon: 'fas fa-font', color: '#6b7280' },

    // Archives
    'zip': { icon: 'fas fa-file-archive', color: '#6b7280' },
    'tar': { icon: 'fas fa-file-archive', color: '#6b7280' },
    'gz': { icon: 'fas fa-file-archive', color: '#6b7280' },
    'rar': { icon: 'fas fa-file-archive', color: '#6b7280' },

    // Lock files
    'lock': { icon: 'fas fa-lock', color: '#6b7280' },

    // Environment
    'env': { icon: 'fas fa-cog', color: '#ecd53f' },
    'env.example': { icon: 'fas fa-cog', color: '#ecd53f' },

    // Default
    'default': { icon: 'fas fa-file', color: '#6b7280' }
};

// Special filename icons
const SPECIAL_FILES = {
    'package.json': { icon: 'fab fa-npm', color: '#cb3837' },
    'package-lock.json': { icon: 'fab fa-npm', color: '#cb3837' },
    'yarn.lock': { icon: 'fab fa-yarn', color: '#2c8ebb' },
    'pnpm-lock.yaml': { icon: 'fas fa-box', color: '#f69220' },
    'tsconfig.json': { icon: 'fas fa-code', color: '#3178c6' },
    'jsconfig.json': { icon: 'fab fa-js', color: '#f7df1e' },
    'webpack.config.js': { icon: 'fas fa-cube', color: '#8dd6f9' },
    'vite.config.js': { icon: 'fas fa-bolt', color: '#646cff' },
    'vite.config.ts': { icon: 'fas fa-bolt', color: '#646cff' },
    'next.config.js': { icon: 'fas fa-n', color: '#000' },
    'tailwind.config.js': { icon: 'fas fa-wind', color: '#38bdf8' },
    '.gitignore': { icon: 'fab fa-git-alt', color: '#f05032' },
    '.eslintrc': { icon: 'fas fa-check-circle', color: '#4b32c3' },
    '.eslintrc.js': { icon: 'fas fa-check-circle', color: '#4b32c3' },
    '.eslintrc.json': { icon: 'fas fa-check-circle', color: '#4b32c3' },
    '.prettierrc': { icon: 'fas fa-palette', color: '#f7b93e' },
    '.prettierrc.json': { icon: 'fas fa-palette', color: '#f7b93e' },
    'README.md': { icon: 'fas fa-book-open', color: '#083fa1' },
    'LICENSE': { icon: 'fas fa-balance-scale', color: '#6b7280' },
    'Dockerfile': { icon: 'fab fa-docker', color: '#2496ed' },
    'docker-compose.yml': { icon: 'fab fa-docker', color: '#2496ed' },
    'docker-compose.yaml': { icon: 'fab fa-docker', color: '#2496ed' },
    '.dockerignore': { icon: 'fab fa-docker', color: '#2496ed' },
    'Makefile': { icon: 'fas fa-cogs', color: '#6d8086' },
    'requirements.txt': { icon: 'fab fa-python', color: '#3776ab' },
    'setup.py': { icon: 'fab fa-python', color: '#3776ab' },
    'go.mod': { icon: 'fab fa-golang', color: '#00add8' },
    'go.sum': { icon: 'fab fa-golang', color: '#00add8' },
    'Cargo.toml': { icon: 'fas fa-cog', color: '#dea584' },
    'Cargo.lock': { icon: 'fas fa-lock', color: '#dea584' }
};

/**
 * Get file icon configuration
 */
function getFileIcon(filename) {
    const lowerName = filename.toLowerCase();

    // Check special files first
    if (SPECIAL_FILES[filename] || SPECIAL_FILES[lowerName]) {
        return SPECIAL_FILES[filename] || SPECIAL_FILES[lowerName];
    }

    // Get extension
    const ext = filename.split('.').pop().toLowerCase();

    // Check if it's a dotfile without extension
    if (filename.startsWith('.') && !filename.includes('.', 1)) {
        return { icon: 'fas fa-cog', color: '#6b7280' };
    }

    return FILE_ICONS[ext] || FILE_ICONS['default'];
}

/**
 * Creates a nested file structure from a flat list
 */
function createFileStructure(fileList) {
    const fileStructure = {};

    fileList.forEach(file => {
        if (file.type !== 'blob') return; // Skip trees (directories)

        let currentLevel = fileStructure;
        const pathParts = file.path.split('/');

        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                currentLevel[part] = {
                    type: 'file',
                    url: file.url,
                    path: file.path,
                    size: file.size
                };
            } else {
                if (!currentLevel[part] || currentLevel[part].type !== 'folder') {
                    currentLevel[part] = { type: 'folder', children: {} };
                }
                currentLevel = currentLevel[part].children;
            }
        });
    });

    return fileStructure;
}

/**
 * Renders the file tree in the container
 */
function renderFileTree(structure, container) {
    container.innerHTML = '';
    const treeElement = createDirectoryElement(structure, 'root');
    container.appendChild(treeElement);
    addFileClickListeners(container);
}

/**
 * Creates a directory element recursively
 */
function createDirectoryElement(directory, name) {
    const ul = document.createElement('ul');
    if (name !== 'root') ul.className = 'tree-directory';

    // Sort: folders first, then files, alphabetically
    const sortedKeys = Object.keys(directory).sort((a, b) => {
        const itemA = directory[a];
        const itemB = directory[b];

        if (itemA.type === 'folder' && itemB.type !== 'folder') return -1;
        if (itemA.type !== 'folder' && itemB.type === 'folder') return 1;
        return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
        const item = directory[key];
        const li = document.createElement('li');

        if (item.type === 'folder') {
            li.innerHTML = `
                <span class="tree-item folder">
                    <i class="fas fa-chevron-right tree-arrow"></i>
                    <i class="fas fa-folder tree-icon" style="color: #f59e0b;"></i>
                    <span class="tree-name">${escapeHtml(key)}</span>
                </span>
            `;
            li.className = 'tree-folder';
            li.appendChild(createDirectoryElement(item.children, key));

            li.querySelector('.tree-item').addEventListener('click', (e) => {
                e.stopPropagation();
                li.classList.toggle('open');

                // Animate folder icon
                const folderIcon = li.querySelector('.tree-icon');
                if (li.classList.contains('open')) {
                    folderIcon.className = 'fas fa-folder-open tree-icon';
                } else {
                    folderIcon.className = 'fas fa-folder tree-icon';
                }
            });
        } else {
            const fileInfo = getFileIcon(key);
            const ext = key.includes('.') ? key.split('.').pop() : '';

            li.innerHTML = `
                <span class="tree-item file" data-url="${item.url}" data-path="${item.path}">
                    <i class="${fileInfo.icon} tree-icon" style="color: ${fileInfo.color};"></i>
                    <span class="tree-name">${escapeHtml(key)}</span>
                </span>
            `;
            li.className = `tree-file ${ext}`;
        }

        ul.appendChild(li);
    });

    return ul;
}

/**
 * Adds click listeners for file selection
 */
function addFileClickListeners(container) {
    container.addEventListener('click', async (e) => {
        const fileItem = e.target.closest('.tree-item.file');
        if (!fileItem) return;

        e.stopPropagation();
        const { url, path } = fileItem.dataset;

        // Highlight selected file
        container.querySelectorAll('.tree-item.file.selected').forEach(el => {
            el.classList.remove('selected');
        });
        fileItem.classList.add('selected');

        // Show loading state
        const currentFileEl = document.getElementById('current-file');
        const codeDisplay = document.getElementById('code-display');

        currentFileEl.textContent = `Loading ${path.split('/').pop()}...`;
        codeDisplay.innerHTML = '<div class="code-loading">Loading...</div>';

        try {
            const content = await fetchFileContent(url);
            displayFileContent(path, content);
        } catch (error) {
            currentFileEl.textContent = `Error loading ${path}`;
            codeDisplay.innerHTML = `<div class="code-error">Failed to load file: ${error.message}</div>`;
            console.error('Error loading file:', error);
        }
    });
}

/**
 * Displays file content with syntax highlighting
 */
function displayFileContent(path, content) {
    const codeDisplay = document.getElementById('code-display');
    const currentFile = document.getElementById('current-file');

    if (!codeDisplay || !currentFile) return;

    currentFile.textContent = path;

    // Handle null/empty content
    if (!content) {
        codeDisplay.textContent = '// No content available';
        return;
    }

    // Set content
    codeDisplay.textContent = content;

    // Apply syntax highlighting
    try {
        hljs.highlightElement(codeDisplay);
    } catch (error) {
        console.warn('Syntax highlighting failed:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add additional CSS for the enhanced file tree
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .tree-directory {
        list-style: none;
        margin: 0;
        padding: 0 0 0 16px;
        display: none;
    }
    
    .tree-folder.open > .tree-directory {
        display: block;
    }
    
    .tree-folder, .tree-file {
        margin: 0;
        padding: 0;
    }
    
    .tree-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        font-size: 0.9rem;
    }
    
    .tree-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .tree-item.selected {
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
    }
    
    .tree-arrow {
        width: 12px;
        font-size: 0.65rem;
        color: var(--text-muted);
        transition: transform 0.2s ease;
    }
    
    .tree-folder.open > .tree-item .tree-arrow {
        transform: rotate(90deg);
    }
    
    .tree-icon {
        width: 16px;
        text-align: center;
        font-size: 0.9rem;
    }
    
    .tree-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .code-loading, .code-error {
        padding: 20px;
        text-align: center;
        color: var(--text-muted);
    }
    
    .code-error {
        color: var(--accent-error, #ef4444);
    }
    
    #file-tree-container > ul {
        padding-left: 0;
    }
`;
document.head.appendChild(additionalStyles);
