let hasGeneratedCards = false;

document.addEventListener('DOMContentLoaded', () => {
    const aboutMe = document.getElementById('about-me');
    const projects = document.getElementById('projects');
    const title = document.getElementById('title');
    const navDivs = document.querySelectorAll('.navDiv');

    const time = document.getElementById("time");
    const state = document.getElementById("state");

    const ageSpan = document.getElementById("age");

    function setAge() {
        const today = new Date();
        const birthDate = new Date("2001-01-12");

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        ageSpan.innerText = age;
    }

    //displays my current timezone
    if (state && time) {
        const localTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) /* fun fact if you're reading this, this is not my timezone. I have reasons but its a close enough approx to my time. */

        const hour = new Date(localTime).getHours();
        const minutes = new Date(localTime).getMinutes();

        if (hour < 9) {
            state.innerHTML = "sleeping";
        } else if (hour < 17) {
            state.innerHTML = "working";
        }

        time.innerHTML = `${hour < 12 ? hour : hour - 12}:${minutes < 10 ? '0' + minutes : minutes} ${hour >= 12 ? "PM" : "AM"}`;
    }

    const toTop = document.getElementById("toTop");

    if (toTop) {
        toTop.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    function setNavSelected(selectedDiv) {
        navDivs.forEach((div) => {
            div.querySelector('span').style.color = '';
            div.querySelector('.button-line').style.backgroundColor = '';
        });
        selectedDiv.querySelector('span').style.color = 'white';
        selectedDiv.querySelector('.button-line').style.backgroundColor = '#4CAF50';
    }

    navDivs.forEach((div, index) => {
        div.addEventListener('click', () => {
            setNavSelected(div);
            if (index === 0) {
                showSection(aboutMe, "About Me");
            } else {
                showSection(projects, "Projects");
                generateCards();
            }
        });
    });

    function showSection(sectionToShow, titleText) {
        aboutMe.style.display = 'none';
        projects.style.display = 'none';
        sectionToShow.style.display = '';
        title.textContent = titleText;
    }

    async function generateCards() {
        if (hasGeneratedCards) return;

        const githubResponse = await fetch("https://api.github.com/users/EB25Ball/repos");
        const githubData = await githubResponse.json();

        githubData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        githubData.forEach(repo => {
            if (!repo.archived) {
                const cardElement = createCard(repo);
                projects.appendChild(cardElement);
            }
        });

        hasGeneratedCards = true;

    }

    function createCard(repo) {
        const date = new Date(repo.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const cardElement = createElement(`
            <div class="github-card">
                <h4 class="card-title">
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                </h4>
                <p class="creation-date">${formattedDate}</p>
                <p>${repo.description || 'No description available.'}</p>
                <section class="card-svg-list">
                    ${repo.fork ? `
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                        </svg>` : ''
            }
                    <span class="svg-right">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true">
                            <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path>
                        </svg> ${repo.watchers}
                    </span>
                    <span class="svg-right">
                        <svg role="img" height="16" viewBox="0 0 16 16" width="16">
                            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                        </svg> ${repo.stargazers_count}
                    </span>
                </section>
            </div>
        `);

        cardElement.addEventListener('click', () => {
            window.location.href = repo.html_url;
        });

        const titleLink = cardElement.querySelector('.card-title a');
        titleLink.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        return cardElement;
    }


    function createElement(html) {
        const template = document.createElement("template");
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }

    showSection(aboutMe, "About Me");
    setNavSelected(navDivs[0]);
    setAge();
});
