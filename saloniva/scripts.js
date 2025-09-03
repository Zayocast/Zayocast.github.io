document.addEventListener('DOMContentLoaded', function() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Disable animations on low-performance devices
    if (window.matchMedia("(max-width: 768px)").matches) {
        gsap.set('.fade-in', { opacity: 1, y: 0 });
    } else {
        // Animate section titles
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 90%', // По-меко стартиране
                    toggleActions: 'play none none none'
                },
                duration: 1,
                y: 50,
                opacity: 0,
                ease: 'power3.out'
            });
        });

        // Animate service cards
        gsap.utils.toArray('.service-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05, // По-малко stagger за плавност
                ease: 'power2.out'
            });
        });

        // Animate team members
        gsap.utils.toArray('.team-member').forEach(member => {
            gsap.from(member, {
                scrollTrigger: {
                    trigger: member,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 1,
                y: 50,
                opacity: 0,
                stagger: 0.1,
                ease: 'power2.out'
            });
        });

        // Animate pricing cards
        gsap.utils.toArray('.pricing-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate offer cards
        gsap.utils.toArray('.offer-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate gallery items
        gsap.utils.toArray('.gallery-item').forEach(item => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate achievement cards
        gsap.utils.toArray('.achievement-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate blog cards
        gsap.utils.toArray('.blog-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate before-after cards
        gsap.utils.toArray('.before-after-card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Animate partner logos
        gsap.utils.toArray('.partner-logo').forEach(logo => {
            gsap.from(logo, {
                scrollTrigger: {
                    trigger: logo,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.05,
                ease: 'power2.out'
            });
        });

        // Fade-in animation on scroll
        gsap.utils.toArray('.fade-in').forEach(el => {
            gsap.fromTo(el, 
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        // Emoji animation
        gsap.to('.emoji', {
            rotation: 360,
            duration: 2,
            repeat: -1,
            ease: "power1.inOut",
            yoyo: true
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    mobileMenuBtn.addEventListener('click', () => {
        const isActive = navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
        mobileMenuBtn.setAttribute('aria-expanded', !isActive);
        mobileMenuBtn.innerHTML = isActive ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
    });

    // Smooth Scroll for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
                // Close mobile menu after clicking a link
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });

    // FAQ functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                gsap.to(i.querySelector('.faq-answer'), {
                    duration: 0.3,
                    maxHeight: 0,
                    padding: 0,
                    opacity: 0,
                    ease: 'power2.out'
                });
            });
            if (!isActive) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
                gsap.to(item.querySelector('.faq-answer'), {
                    duration: 0.3,
                    maxHeight: '200px',
                    padding: '20px',
                    opacity: 1,
                    ease: 'power2.out'
                });
            }
        });
    });

    // Testimonials Slider with Debouncing
    let isSliding = false;
    const testimonials = document.querySelectorAll('.testimonial');
    const testimonialControls = document.querySelectorAll('.testimonial-controls button');
    let currentIndex = 0;
    let autoSlideInterval;

    function showTestimonial(index) {
        if (isSliding) return;
        isSliding = true;

        testimonials.forEach((testimonial, i) => {
            testimonial.classList.remove('active');
            gsap.to(testimonial, { opacity: 0, duration: 0.5, ease: 'power2.out' });
        });

        testimonialControls.forEach(control => control.classList.remove('active'));
        gsap.to(testimonials[index], { 
            opacity: 1, 
            duration: 0.5, 
            ease: 'power2.in',
            onComplete: () => {
                testimonials[index].classList.add('active');
                testimonialControls[index].classList.add('active');
                isSliding = false;
            }
        });

        currentIndex = index;
    }

    // Auto-slide
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            showTestimonial(currentIndex);
        }, 5000);
    }

    // Stop auto-slide on control click
    testimonialControls.forEach((control, index) => {
        control.addEventListener('click', () => {
            if (!isSliding) {
                clearInterval(autoSlideInterval);
                showTestimonial(index);
                startAutoSlide();
            }
        });
    });

    startAutoSlide();

    // Form Validation for Booking
    const bookingForm = document.querySelector('.booking-form');
    bookingForm.addEventListener('submit', (e) => {
        const email = document.querySelector('input[name="email"]').value;
        const phone = document.querySelector('input[name="phone"]').value;
        
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            e.preventDefault();
            alert('Моля, въведете валиден имейл адрес.');
            return;
        }
        
        if (!/^\+?[\d\s-]{9,}$/.test(phone)) {
            e.preventDefault();
            alert('Моля, въведете валиден телефонен номер.');
            return;
        }
    });

    // Newsletter Form Validation
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            const email = newsletterForm.querySelector('input[name="email"]').value;
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                e.preventDefault();
                alert('Моля, въведете валиден имейл адрес.');
            }
        });
    }

    // Cookie Consent
    const cookieConsent = document.getElementById('cookie-consent');
    if (cookieConsent && !localStorage.getItem('cookieConsent')) {
        cookieConsent.style.display = 'flex';
    }
    if (cookieConsent) {
        cookieConsent.querySelector('button').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieConsent.style.display = 'none';
        });
    }

    // Counter Animation for Achievements
    function animateCounter(element, start, end, duration) {
        gsap.fromTo(element, 
            { innerText: start },
            { 
                innerText: end,
                duration: duration,
                snap: { innerText: 1 },
                ease: 'power1.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 90%'
                }
            }
        );
    }
    document.querySelectorAll('.counter').forEach(counter => {
        const endValue = parseInt(counter.innerText);
        counter.innerText = '0';
        animateCounter(counter, 0, endValue, 2);
    });
});