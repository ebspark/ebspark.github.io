document.querySelector('.header-options button:last-child').addEventListener('click', function() {
    document.body.classList.toggle('light-theme');
});

const searchInput = document.querySelector('.search input');
searchInput.addEventListener('input', function() {
    const searchQuery = this.value.toLowerCase();
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchQuery)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});
