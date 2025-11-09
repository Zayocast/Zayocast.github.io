document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Логика за Анимации при Скролване ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1
    });

    const elementsToAnimate = document.querySelectorAll('.fade-in-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    
    // --- 2. Логика за FAQ Акордеон ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const wasActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                if (activeItem !== item) {
                    activeItem.classList.remove('active');
                }
            });
            
            item.classList.toggle('active', !wasActive);
        });
    });

    
    // --- 3. Логика за Lightbox Галерия ---
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.querySelector('.lightbox-overlay');
    const lightboxImg = lightbox.querySelector('.lightbox-content img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    const gallerySources = [];
    galleryItems.forEach(item => {
        gallerySources.push(item.querySelector('img').src);
    });
    
    let currentIndex = 0;

    function showLightbox(index) {
        currentIndex = index;
        // Трик за placeholder-ите: сменяме '600x400' с '1200x800'
        const bigSrc = gallerySources[currentIndex].replace(/(\d+)x(\d+)/g, '1200x800');
        lightboxImg.src = bigSrc; 
        lightbox.style.display = 'flex';
    }

    function closeLightbox() {
        lightbox.style.display = 'none';
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + gallerySources.length) % gallerySources.length;
        showLightbox(currentIndex);
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % gallerySources.length;
        showLightbox(currentIndex);
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showLightbox(index);
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeLightbox();
            }
            if (e.key === 'ArrowLeft') {
                showPrev();
            }
            if (e.key === 'ArrowRight') {
                showNext();
            }
        }
    });

    
    // --- 4. НОВА ЛОГИКА: "Back to Top" бутон ---
    const backToTopBtn = document.getElementById('backToTopBtn');

    window.addEventListener('scroll', () => {
        // Показваме бутона след като скролнем 400px надолу
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    // Забележка: Плавното скролване идва от 'scroll-behavior: smooth;' в CSS!

});