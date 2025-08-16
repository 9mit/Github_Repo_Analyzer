<img width="1870" height="580" alt="image" src="https://github.com/user-attachments/assets/a12d9544-2b5a-4b8c-ac80-63ffa69ccd7b" />
<img width="1879" height="776" alt="image" src="https://github.com/user-attachments/assets/b7c603a7-78eb-4b45-ab15-92c4c463c495" />

# Your CodeBuddy - GitHub Repository Analyzer

![GitHub deployments](https://img.shields.io/github/deployments/YOUR-USERNAME/your-codebuddy/github-pages?label=Live%20Demo&logo=github)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

An intelligent web application designed to help developers quickly understand, analyze, and document any public GitHub repository. Built with vanilla HTML, CSS, and JavaScript, it uses the GitHub API to provide deep insights without requiring any backend or installation.



---

 
*(**Note:** You should replace this with a real screenshot of your application's dashboard)*

## ✨ Key Features

-   📊 **Comprehensive Repository Analysis:** Instantly fetches and displays key repository metadata like stars, forks, owner, and description.
-   🌳 **Interactive File Tree:** Navigate the complete file and directory structure of a repository with an expandable, clickable tree view.
-   🎨 **Syntax-Highlighted Code Viewer:** Read file contents with automatic language detection and syntax highlighting, powered by Highlight.js.
-   🤖 **Intelligent AI Chatbot:** Ask questions about the repository in plain English. The chatbot is context-aware and can find files, explain dependencies, and describe functions.
-   📝 **Automated Documentation Generation:** Generate a boilerplate `README.md` or a detailed `ANALYSIS.md` report based on the repository's structure and contents.
-   ⚙️ **Technology & Language Detection:** Automatically identifies the programming languages used and visualizes their distribution in a pie chart. It can also parse `package.json` to list dependencies.
-   🛠️ **Git Management Guidance:** Provides quick access to the `git clone` command and a simple guide for contributing to a project.

## 🚀 Tech Stack

This project is built with a focus on client-side performance and simplicity, using no front-end frameworks.

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **APIs:** GitHub REST API
-   **Libraries:**
    -   [**Highlight.js**](https://highlightjs.org/) for code syntax highlighting.
    -   [**Marked.js**](https://marked.js.org/) for rendering Markdown content in the browser.
    -   [**Chart.js**](https://www.chartjs.org/) for data visualization of language distribution.
    -   [**Font Awesome**](https://fontawesome.com/) for icons.

## 🛠️ How It Works

The application operates in three simple steps:

1.  **Enter URL:** Paste the URL of any public GitHub repository into the input field.
2.  **Analyze:** The application calls the GitHub API to fetch repository metadata, the full file tree (recursively), and language statistics.
3.  **Explore:** The dashboard appears with multiple tabs, allowing you to explore the file structure, read the README, generate analysis, visualize the tech stack, and chat with the CodeBuddy assistant.

## 📁 Project Structure

The codebase is organized to separate concerns, making it modular and easy to maintain.

```
your-codebuddy/
├── index.html            # Main HTML structure and entry point
├── css/
│   ├── styles.css        # Core styling for all components
│   └── responsive.css    # Media queries for different screen sizes
├── js/
│   ├── main.js           # Core application logic, event listeners, and workflow
│   ├── github-api.js     # Functions for interacting with the GitHub API
│   ├── file-viewer.js    # Logic for rendering the file tree and code viewer
│   ├── analyzer.js       # Functions for generating README and ANALYSIS reports
│   └── chatbot.js        # Intent recognition and response logic for the chatbot
└── images/
    └── hero-illustration.svg # Illustration for the hero section
```

## ⚙️ Local Setup and Installation

Since this is a vanilla web project, there are no complex build steps.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR-USERNAME/your-codebuddy.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd your-codebuddy
    ```

3.  **Open `index.html` in your browser.**
    -   For the best experience, use a local web server to avoid potential browser restrictions on local file access. A great tool for this is the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or have found a bug, please feel free to contribute.

1.  **Fork** the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---
Made with ❤️ by [Your Name](https://github.com/YOUR-USERNAME)

