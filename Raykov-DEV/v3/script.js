document.addEventListener('DOMContentLoaded', () => {
    
    // --- Loading Screen ---
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
    }, 2200); // Малко повече време, за да се види анимацията

    // --- Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Затваряне на менюто при клик на линк
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // --- Scroll Reveal Animation (Intersection Observer) ---
    const hiddenElements = document.querySelectorAll('.hidden');
    
    const observerOptions = {
        root: null,
        threshold: 0.15, // Елементът трябва да е 15% видим, за да се активира
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // Спираме да наблюдаваме елемента след като се покаже веднъж
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    hiddenElements.forEach(el => observer.observe(el));

    // --- Header Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '10px 0';
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.background = 'rgba(10, 10, 10, 0.9)';
        }
    });

    // --- Simple Parallax for Hero Icons ---
    const hero = document.querySelector('.hero');
    const icon1 = document.querySelector('.icon-1');
    const icon2 = document.querySelector('.icon-2');

    hero.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        icon1.style.transform = `translate(-${x * 30}px, -${y * 30}px) rotate(-15deg)`;
        icon2.style.transform = `translate(${x * 20}px, ${y * 20}px) rotate(10deg)`;
    });

});