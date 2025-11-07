// 0.9 сек лоадър
setTimeout(() => {
    document.getElementById('loader').style.opacity = 0;
    setTimeout(() => document.getElementById('loader').remove(), 600);
}, 900);

// Куба
const cube = document.getElementById('cube');
let isDragging = false;
let previousX, previousY;

// Мишка / тъч
const startDrag = (e) => {
    isDragging = true;
    previousX = e.clientX || e.touches[0].clientX;
    previousY = e.clientY || e.touches[0].clientY;
};
const drag = (e) => {
    if (!isDragging) return;
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;
    const deltaX = x - previousX;
    const deltaY = y - previousY;
    previousX = x; previousY = y;

    const rotateY = deltaX * 0.5;
    const rotateX = deltaY * -0.5;

    cube.style.transform = cube.style.transform.replace(/rotate[XY]\([^)]*\)/g, '');
    cube.style.transform += ` rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
};
const stopDrag = () => isDragging = false;

window.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', drag);
window.addEventListener('mouseup', stopDrag);
window.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', drag);
window.addEventListener('touchend', stopDrag);

// Меню – клик = върти куба
document.querySelectorAll('.menu-item').forEach((item, i) => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        const angles = [
            'rotateX(0deg) rotateY(0deg)',      // front
            'rotateY(-180deg)',                 // back
            'rotateY(-90deg)',                  // right
            'rotateY(90deg)',                   // left
            'rotateX(-90deg)',                  // top
            'rotateX(90deg)'                    // bottom
        ];
        gsap.to(cube, { rotationY: angles[i].match(/-?\d+/g).map(n=>+n*1.5).join(','), duration: 1.2, ease: "power2.inOut" });
    });
});

// Тайна – 3 клика = конфети + меме
let secretClicks = 0;
document.querySelector('[data-section="easter"]').addEventListener('click', () => {
    if (++secretClicks === 3) {
        alert("🎉 ДОБРЕ ДОШЪЛ В ТАЙНАТА СТАЯ! 🎉\nТи си истински мемер!");
        document.body.style.background = "#e63946";
        setTimeout(() => location.reload(), 2000);
    }
});

// Форма
document.getElementById('quick-form').onsubmit = e => {
    e.preventDefault();
    alert("🚀 Съобщение изпратено в космоса!\nОчаквай меме в 3...2...1...");
};

// Звезди
for(let i=0; i<200; i++) {
    const star = document.createElement('div');
    star.style.position = 'absolute';
    star.style.width = star.style.height = Math.random()*3 + 'px';
    star.style.background = 'white';
    star.style.borderRadius = '50%';
    star.style.left = Math.random()*100 + 'vw';
    star.style.top = Math.random()*100 + 'vh';
    star.style.animation = `twinkle ${Math.random()*3+2}s infinite alternate`;
    document.getElementById('stars').appendChild(star);
}