document.addEventListener('DOMContentLoaded', () => {
    
    // --- Loading Screen ---
    const loader = document.getElementById('loader');
    
    // Симулираме малко по-дълго зареждане за ефект, или когато страницата е готова
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, 2000); // 2 секунди изчакване след зареждане на ресурсите
    });

    // --- Mobile Menu ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Scroll Reveal Animation ---
    const hiddenElements = document.querySelectorAll('.hidden');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Спираме да наблюдаваме след показване
            }
        });
    }, {
        threshold: 0.15 // 15% видимост за активация
    });

    hiddenElements.forEach(el => observer.observe(el));

    // --- Number Counter Animation ---
    const statsSection = document.querySelector('.stats-grid');
    let statsAnimated = false;

    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !statsAnimated) {
            const counters = document.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000; // 2 секунди за броене
                const step = target / (duration / 16); // 60fps

                let current = 0;
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.innerText = Math.ceil(current) + '+';
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target + '+';
                        if (target === 98) counter.innerText = target + '%'; // Специален случай за процентите
                    }
                };
                updateCounter();
            });
            statsAnimated = true;
        }
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

});