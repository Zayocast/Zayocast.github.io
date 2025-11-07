document.addEventListener('DOMContentLoaded', () => {
    
    // --- CUSTOM CURSOR SETUP ---
    // Проверяваме дали устройството има мишка (за да не пречи на touch screens)
    if (matchMedia('(pointer:fine)').matches) {
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        
        let posX = 0, posY = 0;
        let mouseX = 0, mouseY = 0;

        // Основно движение
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Главната точка се движи моментално
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Follower-ът се движи с леко закъснение (lerp ефект)
        function animateFollower() {
            posX += (mouseX - posX) / 9;
            posY += (mouseY - posY) / 9;
            
            follower.style.left = posX + 'px';
            follower.style.top = posY + 'px';
            
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        // Ховър ефекти
        const hoverTargets = document.querySelectorAll('.hover-target, a, button');
        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => {
                cursor.classList.add('active');
                follower.classList.add('active');
            });
            target.addEventListener('mouseleave', () => {
                cursor.classList.remove('active');
                follower.classList.remove('active');
            });
        });
    }

    // --- MENU TOGGLE ---
    const menuTrigger = document.querySelector('.menu-trigger');
    const menuClose = document.querySelector('.menu-close');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuLinks = document.querySelectorAll('.menu-link');

    function toggleMenu() {
        menuOverlay.classList.toggle('active');
    }

    menuTrigger.addEventListener('click', toggleMenu);
    menuClose.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // --- GLITCH EFFECT ON HERO LOAD (Optional Flavor) ---
    const glitchTexts = document.querySelectorAll('.glitch');
    setTimeout(() => {
        glitchTexts.forEach(text => {
            text.style.animation = 'none'; // Спираме бъгавия ефект след малко, за да не дразни
        });
    }, 2000);

});