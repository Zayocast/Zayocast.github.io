// 1.2 сек лоадър и изчезва
setTimeout(() => {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => document.getElementById('loader').remove(), 600);
}, 1200);

// Navbar scroll
window.addEventListener('scroll', () => {
    document.querySelector('.nav').classList.toggle('scrolled', scrollY > 50);
});

// Плавен скрол
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Паралакс (лек)
window.addEventListener('scroll', () => {
    document.querySelectorAll('.parallax').forEach(el => {
        const speed = el.dataset.speed || 0.3;
        el.style.backgroundPositionY = `${scrollY * speed}px`;
    });
});

// Формата – меме
document.getElementById('contact-form').onsubmit = e => {
    e.preventDefault();
    alert('БРАВО! Съобщението ти е в космоса 🚀\nСкоро ще ти пратя меме в отговор!');
    e.target.reset();
};