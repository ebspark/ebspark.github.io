document.querySelector('.header-options button:last-child').addEventListener('click', function () {
    document.body.classList.toggle('light-theme');
});

function updateNavTime() {
    const timeElement = document.getElementById('time');
    const options = {
        timeZone: 'America/New_York',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
    };

    timeElement.textContent = new Date().toLocaleTimeString('en-US', options);
}

updateNavTime();
setInterval(updateNavTime, 60000);

const searchInput = document.querySelector('.search input');
searchInput.addEventListener('input', function () {
    const searchQuery = this.value.toLowerCase();

    const projectGrid = document.getElementById('project-grid');
    if (projectGrid) {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            if (title.includes(searchQuery) || description.includes(searchQuery)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    } else {
        const mainContent = document.querySelector('.main-content');
        removeHighlights(mainContent);

        if (searchQuery) {
            highlightText(mainContent, searchQuery);
        }
    }
});

function removeHighlights(element) {
    const highlights = element.getElementsByClassName('highlight');
    while (highlights.length > 0) {
        const parent = highlights[0].parentNode;
        parent.replaceChild(document.createTextNode(highlights[0].textContent), highlights[0]);
        parent.normalize();
    }
}

function highlightText(element, searchText) {
    if (!searchText) return;

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const regex = new RegExp(`(${searchText})`, 'gi');
    let node;
    const nodesToReplace = [];

    while ((node = walker.nextNode())) {
        if (node.nodeValue.toLowerCase().includes(searchText.toLowerCase())) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(node => {
        const parent = node.parentNode;
        if (parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE') {
            const fragment = document.createDocumentFragment();
            const parts = node.nodeValue.split(regex);

            parts.forEach(part => {
                if (part.toLowerCase() === searchText.toLowerCase()) {
                    const span = document.createElement('span');
                    span.className = 'highlight';
                    span.textContent = part;
                    
                    const computedFontSize = window.getComputedStyle(parent).fontSize;
                    span.style.fontSize = computedFontSize;
                    
                    fragment.appendChild(span);
                    
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });

            parent.replaceChild(fragment, node);
        }
    });
}
class Picker {
    constructor() {
        this.list = document.querySelector('.text-list');
        this.selectedIndex = 0;
        this.isUserScrolling = false;
        this.lastScrollTime = 0;
        this.init();
    }

    init() {
        this.setPadding();
        this.buildOptions();
        this.scrollToSelected();
        this.initializeEventListeners();
    }

    setPadding() {
        const padding = document.querySelector('.text-picker').clientHeight / 2;
        this.list.style.padding = `${padding}px 0`;
    }

    buildOptions() {
        const options = ['Projects', 'About Me', 'Contact Me', 'Socials'];
        this.list.innerHTML = options.map((text, index) =>
            `<div class="text-option" data-index="${index}">${text}</div>`
        ).join('');
        this.selectedIndex = Math.min(this.selectedIndex, options.length - 1);
        this.updateSelection();
    }

    initializeEventListeners() {
        this.list.addEventListener('scroll', this.handleScroll.bind(this));
        this.list.addEventListener('touchstart', () => this.isUserScrolling = true);
        this.list.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.list.addEventListener('click', this.handleClick.bind(this));
        window.addEventListener('resize', () => this.setPadding());
    }

    handleScroll() {
        this.lastScrollTime = Date.now();
        requestAnimationFrame(() => this.updateSelection());
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            if (Date.now() - this.lastScrollTime >= 150 && !this.isUserScrolling) {
                this.snapToClosest();
            }
        }, 150);
    }

    handleTouchEnd() {
        this.isUserScrolling = false;
        setTimeout(() => {
            if (!this.isUserScrolling) this.snapToClosest();
        }, 150);
    }

    handleClick(e) {
        const option = e.target.closest('.text-option');
        if (option) {
            this.selectedIndex = parseInt(option.dataset.index);
            this.scrollToSelected();
        }
    }

    updateSelection() {
        const center = this.list.getBoundingClientRect().top + this.list.clientHeight / 2;
        Array.from(this.list.children).forEach(option => {
            const rect = option.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - center);

            option.className = 'text-option';
            if (distance < 10) {
                option.classList.add('selected');
                this.selectedIndex = parseInt(option.dataset.index);
            } else if (distance < 40) {
                option.classList.add('nearer');
            } else if (distance < 90) {
                option.classList.add('near');
            } else if (distance < 120) {
                option.classList.add('far');
            } else {
                option.classList.add('super-far');
            }
        });
    }

    snapToClosest() {
        const center = this.list.getBoundingClientRect().top + this.list.clientHeight / 2;
        const closestOption = Array.from(this.list.children).reduce((closest, option) => {
            const rect = option.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - center);
            return distance < closest.distance ? { element: option, distance } : closest;
        }, { distance: Infinity }).element;

        if (closestOption) {
            this.selectedIndex = parseInt(closestOption.dataset.index);
            const targetScroll = closestOption.offsetTop -
                (this.list.clientHeight - closestOption.clientHeight) / 2;
            this.smoothScrollTo(targetScroll);

            if (window.router) {
                const page = closestOption.textContent.toLowerCase().replace(/\s+/g, '');
                if (window.router.currentPage !== page) {
                    window.router.navigateToPage(page);
                }
            }
        }
    }

    smoothScrollTo(targetScroll) {
        this.isUserScrolling = true;
        const startScroll = this.list.scrollTop;
        const startTime = performance.now();
        const duration = 400;

        const animate = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = this.easeInOutCubic(progress);
            this.list.scrollTop = startScroll + (targetScroll - startScroll) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isUserScrolling = false;
                this.updateSelection();
            }
        };

        requestAnimationFrame(animate);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    scrollToSelected() {
        const selectedOption = this.list.children[this.selectedIndex];
        if (selectedOption) {
            const targetScroll = selectedOption.offsetTop -
                (this.list.clientHeight - selectedOption.clientHeight) / 2;
            this.smoothScrollTo(targetScroll);
        }
    }
}

const pages = {
    'projects': `
      <section id="project-grid">
      </section>
    `,

    'aboutme': `
        <section class="about-content" id="about-content">
            <h1>About Me</h1>
                <p>Hi, I am <strong _title="aka EB Spark">Ethan B!</strong> I am a Web Developer & Programmer with 3 years of experience. I have a strong drive in computer programming and like to learn new skill sets. In my free time, I enjoy developing websites, creating games, and automating repetitive tasks to work more efficiently.
                <br>
                                <br>

                For a while now I have been helping other developers with tools and coding. I have been enjoying messing around with api's and a bit of white hack hacking. Coding for the most part of the last year or 2 I helped make tools for <a href="https://grabvr.quest" target="_blank">GRAB</a>, a vr game, which I also got to do some api white hat hacking for too! 
                <br>
                <br>
                I am apart of my highschools robotics coding team for the robot and I help build it. I have experience with using the Rasbery Pi, pid motor controls, different sensors and controller controls. Our robot code is mainly written in Java, thus I have gained most of my experience with Java through Robotics. 
                </p>
            <h2>Technical Skills</h2>
            <div class="skills-grid">
            </div>
            <br/>
            <small>This site was made with pure HTML, JavaScript, and CSS! No extra libraries!</small>

        </section>
    `,

    'availability': `
    `,
    'contactme': `
          <section class="availability-content" id="availability-content">
    <div class="availability-card">
        <div class="availability-header">
            <h2>My Availability</h2>
            <span class="timezone">GMT-5</span>
        </div>
        
        <div class="time-display">
            <div class="time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            </div>
            <div class="time-info">
                <span id="current-time">--:-- --</span>
                <span class="time-subtext">Local Time</span>
            </div>
        </div>

        <div class="status-display">
            <div class="status-icon" id="status-icon">
            </div>
            <div class="status-info">
                <span>I'm currently</span>
                <span id="availability-status">checking status...</span>
            </div>
        </div>

        <div class="contact-info">
            <p>Feel free to reach out! I'll get back to you as soon as possible.</p>
            <a href="mailto:eb25spark@gmail.com" class="email-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                eb25spark@gmail.com
            </a>
        </div>
    </div>
</section>
    `,
    'socials': `<section class="socials-content">
        <h1>Connect With Me</h1>
        <div class="socials-grid">
            <a href="https://github.com/ebspark" class="social-card">
                <div class="social-icon github">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </div>
                <div class="social-info">
                    <h3>GitHub</h3>
                    <p>Check out my projects</p>
                </div>
            </a>



            <a href="http://discordapp.com/users/461694991467544577" class="social-card">
                <div class="social-icon discord">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                </div>
                <div class="social-info">
                    <h3>Discord</h3>
                    <p>Join my community</p>
                </div>
            </a>
        </div>
    </section> `

};

class SkillsManager {
    constructor() {
        this.skills = [
            {
                name: 'JavaScript',
                experience: '3 years',
                level: 'Advanced',
                icon: 'JS',
                proficiency: 90
            },
            {
                name: 'HTML/CSS',
                experience: '3 years',
                level: 'Intermediate',
                icon: '🌐',
                proficiency: 80
            },
            {
                name: 'Vue.js',
                experience: '2 years',
                level: 'Intermediate',
                icon: 'V',
                proficiency: 85
            },
            {
                name: 'Three.js',
                experience: '2 years',
                level: 'Intermediate',
                icon: '🎮',
                proficiency: 75
            },
            {
                name: 'Python',
                experience: '2 years',
                level: 'Intermediate',
                icon: '🐍',
                proficiency: 80
            },
            {
                name: 'Java',
                experience: '1 year',
                level: 'Novice',
                icon: '☕',
                proficiency: 60
            },
            {
                name: 'C++',
                experience: '1 year',
                level: 'Beginner',
                icon: '⚙️',
                proficiency: 45
            },
            {
                name: 'TypeScript',
                experience: '1 year',
                level: 'Beginner',
                icon: '📘',
                proficiency: 15
            }
        ];
    }

    createSkillCard(skill) {
        return `
            <div class="skill-card">
                <div class="skill-header">
                    <div class="skill-icon">${skill.icon}</div>
                    <div class="skill-info">
                        <h3>${skill.name}</h3>
                        <p>${skill.level} • ${skill.experience}</p>
                    </div>
                </div>
                <div class="experience-bar">
                    <div class="experience-fill" style="width: ${skill.proficiency}%"></div>
                </div>
            </div>
        `;
    }

    renderSkills() {
        const skillsGrid = document.querySelector('.skills-grid');
        if (skillsGrid) {
            skillsGrid.innerHTML = this.skills.map(skill => this.createSkillCard(skill)).join('');
        }
    }
}

const skillsManager = new SkillsManager();
const picker = new Picker();
class Router {
    constructor() {
        this.mainContent = document.querySelector('.main-content');
        this.currentPage = '';
        this.availabilityManager = new AvailabilityManager(this);
        this.setupNavigation();
        this.loadInitialPage();
    }

    setupNavigation() {
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('a');
                if (target) {
                    const page = target.getAttribute('href')?.replace('#', '').toLowerCase().trim().replace(' ', '');
                    const index = parseInt(target.getAttribute('data-index'), 10);
                    this.navigateToPage(page);
                    
                    picker.selectedIndex = index;
                    picker.scrollToSelected();
                }
            });
        });
    }

    loadInitialPage() {
        const initialPage = window.location.hash.slice(1) || 'aboutme';
        const initialIndex = this.getIndexForPage(initialPage);
        this.navigateToPage(initialPage);

        if (initialIndex !== -1) {
            picker.selectedIndex = initialIndex;
            picker.scrollToSelected();
        }
    }

    navigateToPage(page) {
        if (pages[page] && page !== this.currentPage) {
            window.location.hash = page;
            this.mainContent.classList.add('fade-out');
            setTimeout(() => {
                this.mainContent.innerHTML = pages[page]+ `    <footer>
        <a target="_blank" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a> 2024-PRESENT © Ethan B
    </footer>`;
                this.mainContent.classList.remove('fade-out');
                this.currentPage = page;
                this.updateSearchPlaceholder(page);
                this.handleSpecialPages(page);
            }, 300);
        }
    }

    updateSearchPlaceholder(page) {
        if (page === 'projects') {
            generateCards();
            searchInput.setAttribute('placeholder', "Project Name");
        } else {
            searchInput.setAttribute('placeholder', "Search something up!");
        }
    }

    handleSpecialPages(page) {
        if (page === "aboutme") {
            skillsManager.renderSkills();
        }
        if (page === 'contactme') {
            this.availabilityManager.startAutoUpdate();
        } else {
            this.availabilityManager.stopAutoUpdate();
        }
    }

    getIndexForPage(page) {
        const link = document.querySelector(`.sidebar-menu a[href="#${page}"]`);
        return link ? parseInt(link.getAttribute('data-index'), 10) : -1;
    }
}

async function generateCards() {
    try {
        const projectGrid = document.getElementById("project-grid");
        if (!projectGrid) throw new Error("Project grid element not found");

        const githubResponse = await fetch("https://api.github.com/users/ebspark/repos");
        if (!githubResponse.ok) throw new Error(`GitHub API returned ${githubResponse.status}`);

        const githubData = await githubResponse.json();
        githubData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .filter(repo => !repo.archived)
            .forEach((repo, index) => {
                const cardElement = createCard(repo);
                cardElement.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s forwards`;
                projectGrid.appendChild(cardElement);
            });
    } catch (error) {
        console.error("Error generating cards:", error);
    }
}

function createCard(repo) {
    const date = new Date(repo.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const div = document.createElement('div');
    div.className = 'project-card';

    const metadata = `
      <div class="repo-metadata">
        ${repo.language ? `<span class="language"><span class="lang-circle" style="background-color: ${getLanguageColor(repo.language)}"></span>${repo.language}</span>` : ''}
        <span class="stars"><svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16"><path fill="currentColor" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path></svg>${repo.stargazers_count}</span>
        <span class="forks"><svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16"><path fill="currentColor" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>${repo.forks_count}</span>
      </div>
    `;

    const footer = `
      <div class="card-footer">
        <span class="date">Created: ${formattedDate}</span>
        ${repo.license ? `<span class="license">${repo.license.spdx_id}</span>` : ''}
        ${repo.archived ? '<span class="status archived">Archived</span>' : '<span class="status active">Active</span>'}
      </div>
    `;

    div.innerHTML = `
      <a href="${repo.html_url}" target="_blank" class="card-content">
        <div class="card-header">
          <h3>${repo.name}</h3>
          <svg class="github-icon" height="20" width="20" viewBox="0 0 16 16">
            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
        </div>
        <p>${repo.description || 'No description available.'}</p>
        ${metadata}
        ${footer}
      </a>
    `;

    return div;
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'Python': '#3572A5',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'TypeScript': '#2b7489',
        'default': '#6e7681'
    };
    return colors[language] || colors.default;
}

class AvailabilityManager {
    constructor(router) {
        this.router = router;
        this.statusConfigs = {
            sleeping: { hours: { start: 23, end: 7 }, status: 'probably sleeping', icon: this.getSleepingIcon() },
            wakingUp: { hours: { start: 7, end: 9 }, status: 'just waking up', icon: this.getWakingUpIcon() },
            available: { status: 'available', icon: this.getAvailableIcon() }
        };
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        this.updateTime();
        this.intervalId = setInterval(() => this.router.currentPage === "availability" && this.updateTime(), 60000);
    }

    stopAutoUpdate() {
        clearInterval(this.intervalId);
    }

    updateTime() {
        const timeElement = document.getElementById('current-time');
        const statusElement = document.getElementById('availability-status');
        const statusIcon = document.getElementById('status-icon');

        if (!timeElement || !statusElement || !statusIcon) return;

        const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        const date = new Date(now);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        timeElement.textContent = this.formatTime(hours, minutes);
        const status = this.getStatus(hours);

        statusElement.textContent = status.status;
        statusIcon.innerHTML = status.icon;
        statusIcon.className = `status-icon ${status.status.replace(' ', '-')}`;
    }

    formatTime(hours, minutes) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }

    getStatus(hours) {
        const { sleeping, wakingUp, available } = this.statusConfigs;
        if (hours >= sleeping.hours.start || hours < sleeping.hours.end) return sleeping;
        if (hours >= wakingUp.hours.start && hours < wakingUp.hours.end) return wakingUp;
        return available;
    }

    getSleepingIcon() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>`;
    }

    getWakingUpIcon() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>`;
    }

    getAvailableIcon() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2"/>
            <path d="M12 20v2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41"/>
            <circle cx="12" cy="12" r="4"/>
        </svg>`;
    }
}

const router = new Router();
window.router = router;
