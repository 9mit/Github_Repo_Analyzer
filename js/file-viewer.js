function createFileStructure(fileList) {
    const fileStructure = {};
    fileList.forEach(file => {
        let currentLevel = fileStructure;
        const pathParts = file.path.split('/');
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                currentLevel[part] = { type: 'file', url: file.url, path: file.path };
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

function renderFileTree(structure, container) {
    container.innerHTML = '';
    const treeElement = createDirectoryElement(structure, 'root');
    container.appendChild(treeElement);
    addFileClickListeners(container);
}

function createDirectoryElement(directory, name) {
    const ul = document.createElement('ul');
    if (name !== 'root') ul.className = 'directory';
    
    // Sort so folders appear before files
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
            li.innerHTML = `<i class="fas fa-folder"></i> ${key}`;
            li.className = 'folder';
            li.appendChild(createDirectoryElement(item.children, key));
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

function addFileClickListeners(container) {
    container.addEventListener('click', async (e) => {
        const fileEl = e.target.closest('.file');
        if (fileEl) {
            e.stopPropagation();
            const { url, path } = fileEl.dataset;
            
            // Highlight selected file
            container.querySelectorAll('.file.selected').forEach(el => el.classList.remove('selected'));
            fileEl.classList.add('selected');
            
            document.getElementById('current-file').textContent = 'Loading...';
            document.getElementById('code-display').textContent = '';

            try {
                const content = await fetchFileContent(url);
                displayFileContent(path, content);
            } catch (error) {
                document.getElementById('current-file').textContent = `Error loading ${path}`;
                console.error(error);
            }
        }
    });
}

function displayFileContent(path, content) {
    const codeDisplay = document.getElementById('code-display');
    const currentFile = document.getElementById('current-file');
    
    currentFile.textContent = path;
    codeDisplay.textContent = content;
    hljs.highlightElement(codeDisplay);
}
