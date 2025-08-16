/**
 * Creates a nested object structure from a flat file list.
 * @param {Array<object>} fileList - The flat list of files from GitHub API.
 * @returns {object} - A nested object representing the directory structure.
 */
function createFileStructure(fileList) {
    const fileStructure = {};
    fileList.forEach(file => {
        let currentLevel = fileStructure;
        const pathParts = file.path.split('/');

        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                // This is the last part, so it's a file.
                currentLevel[part] = { type: 'file', url: file.url, path: file.path };
            } else {
                // This is a directory part of the path.
                //
                // **THE FIX IS HERE:**
                // If the entry doesn't exist OR if it was previously (and incorrectly)
                // marked as a file, we overwrite it and ensure it's a folder.
                if (!currentLevel[part] || currentLevel[part].type !== 'folder') {
                    currentLevel[part] = { type: 'folder', children: {} };
                }
                // Now we can safely access .children.
                currentLevel = currentLevel[part].children;
            }
        });
    });
    return fileStructure;
}


/**
 * Renders the file tree into the DOM.
 * @param {object} structure - The nested file structure.
 * @param {HTMLElement} container - The container element to render into.
 */
function renderFileTree(structure, container) {
    container.innerHTML = '';
    const treeElement = createDirectoryElement(structure);
    container.appendChild(treeElement);
    addFileClickListeners();
}

function createDirectoryElement(directory) {
    const ul = document.createElement('ul');
    ul.className = 'directory';
    Object.keys(directory).sort().forEach(key => {
        const item = directory[key];
        const li = document.createElement('li');
        if (item.type === 'folder') {
            li.innerHTML = `<i class="fas fa-folder"></i> ${key}`;
            li.className = 'folder';
            li.appendChild(createDirectoryElement(item.children));
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                li.classList.toggle('open');
            });
        } else {
            li.innerHTML = `<i class="fas fa-file-code"></i> ${key}`;
            li.className = 'file';
            li.dataset.url = item.url;
            li.dataset.path = item.path;
        }
        ul.appendChild(li);
    });
    return ul;
}

/**
 * Adds click listeners to all file elements in the tree.
 */
function addFileClickListeners() {
    document.querySelectorAll('.file-tree .file').forEach(fileEl => {
        fileEl.addEventListener('click', async (e) => {
            e.stopPropagation();
            const url = e.currentTarget.dataset.url;
            const path = e.currentTarget.dataset.path;
            
            document.getElementById('current-file').textContent = 'Loading...';
            document.getElementById('code-display').textContent = '';

            try {
                const content = await fetchFileContent(url);
                displayFileContent(path, content);
            } catch (error) {
                document.getElementById('current-file').textContent = `Error loading ${path}`;
                console.error(error);
            }
        });
    });
}

/**
 * Displays file content in the code viewer with syntax highlighting.
 * @param {string} path - The path of the file.
 * @param {string} content - The content of the file.
 */
function displayFileContent(path, content) {
    const codeDisplay = document.getElementById('code-display');
    const currentFile = document.getElementById('current-file');
    
    currentFile.textContent = path;
    codeDisplay.textContent = content;
    hljs.highlightElement(codeDisplay);
}