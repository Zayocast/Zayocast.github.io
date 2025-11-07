// Basic helpers
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loader
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    if (!loader) return;

    // кратък таймаут за по-меко усещане
    setTimeout(() => {
        loader.classList.add('loader--hidden');
    }, 600);
});

// Dynamic year in footer
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('main-nav--open');
        navToggle.setAttribute('aria-expanded', String(isOpen));

        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        navToggle.classList.toggle('nav-toggle--active');
    });

    // Close nav on link click (mobile)
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;

        if (nav.classList.contains('main-nav--open')) {
            nav.classList.remove('main-nav--open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
});

// Smooth scroll for internal links
document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

// Scroll reveal
document.addEventListener('DOMContentLoaded', () => {
    if (prefersReducedMotion) {
        // Ако потребителят не иска анимации – показваме всичко директно
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('is-visible');
        });
        return;
    }

    const revealEls = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        // Fallback – без анимации
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.18
        }
    );

    revealEls.forEach(el => observer.observe(el));
});

// Parallax effect
document.addEventListener('DOMContentLoaded', () => {
    if (prefersReducedMotion) return;

    const parallaxEls = document.querySelectorAll('[data-parallax-speed]');
    if (!parallaxEls.length) return;

    const handleScroll = () => {
        const scrollY = window.scrollY || window.pageYOffset;

        parallaxEls.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.2;
            const offset = scrollY * speed;
            el.style.transform = `translateY(${offset * -1}px)`;
        });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
});

// Back to top button
document.addEventListener('DOMContentLoaded', () => {
    const toTopBtn = document.querySelector('.to-top');
    if (!toTopBtn) return;

    const toggleVisibility = () => {
        if (window.scrollY > 320) {
            toTopBtn.classList.add('to-top--visible');
        } else {
            toTopBtn.classList.remove('to-top--visible');
        }
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    toTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
