const output = document.getElementById('output');
const input = document.getElementById('cmd');
const container = document.getElementById('card-container');

const commands = {
    help: () => `
<span style="color:#0f0">╭─────────────────────────────────╮</span><br>
<span style="color:#0f0">│  ДОБРЕ ДОШЪЛ В RAYKOV.TERMINAL │</span><br>
<span style="color:#0f0">╰─────────────────────────────────╯</span><br>
<span style="color:#e63946">Команди:</span><br>
• about     → кой съм аз<br>
• projects  → виж проектите ми<br>
• skills    → суперсилите ми<br>
• contact   → пиши ми<br>
• clear     → изчисти терминала<br>
• meme      → тайна<br>
    `,

    about: () => `
<span style="color:#e63946">> RAYKOV.EXE ЗАРЕДЕН</span><br>
Аз съм Райков. Кодирам сайтове, които летят.<br>
Обичам React, GSAP и 3-часови меме сесии.<br>
<span style="color:#0f0">> Статус: готов за хак</span>
    `,

    projects: () => {
        spawnCard(30, 20, "Todo v69", "React + LocalStorage + 420 мемета");
        spawnCard(40, 35, "Dark Mode Pro", "Тъмно като душата ми");
        spawnCard(50, 50, "API King", "REST в мир");
        return "<span style='color:#e63946'>> 3D КАРТИ СЪЗДАДЕНИ!</span> Докосни ги!";
    },

    skills: () => `
<span style="color:#0f0">╭── СУПЕРСИЛИ ──╮</span><br>
HTML/CSS   ██████████ 99%<br>
JavaScript █████████▒ 95%<br>
Мемета     ██████████ 420%<br>
<span style="color:#e63946">> OVER 9000!</span>
    `,

    contact: () => {
        setTimeout(() => {
            addLine("<span style='color:#0f0'>[BOT]: Здрасти! Искаш ли меме?</span>");
            setTimeout(() => addLine("<input type='text' id='chat' placeholder='пиши тук...' autofocus>"), 1000);
        }, 800);
        return "<span style='color:#e63946'>> ЧАТБОТ СТАРТИРАН</span>";
    },

    meme: () => `
<span style="color:#e63946">> ДОСТЪП ДО ТАЙНАТА ПАПКА...</span><br>
<img src="https://i.imgur.com/8p2j2.gif" width="200"><br>
<span style="color:#0f0">> ТИ СИ ЛЕГЕНДА!</span>
    `,

    clear: () => { output.innerHTML = ''; return ''; }
};

function addLine(text) {
    const line = document.createElement('div');
    line.innerHTML = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function spawnCard(top, left, title, desc) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.top = top + '%';
    card.style.left = left + '%';
    card.style.transform = `translate(-50%, -50%) rotateY(${Math.random()*30-15}deg)`;
    card.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    card.style.animation = 'spawn 0.8s ease-out';
    container.appendChild(card);

    // Драг с мишка/пръст
    let isDragging = false, startX, startY;
    card.onmousedown = card.ontouchstart = e => {
        isDragging = true;
        startX = (e.clientX || e.touches[0].clientX) - card.offsetLeft;
        startY = (e.clientY || e.touches[0].clientY) - card.offsetTop;
    };
    document.onmousemove = document.ontouchmove = e => {
        if (!isDragging) return;
        card.style.left = (e.clientX || e.touches[0].clientX) - startX + 'px';
        card.style.top = (e.clientY || e.touches[0].clientY) - startY + 'px';
    };
    document.onmouseup = document.ontouchend = () => isDragging = false;
}

input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const cmd = input.value.trim().toLowerCase();
        addLine(`<span class="prompt">guest@raykov:~$</span> ${cmd}`);
        
        const response = commands[cmd] ? commands[cmd]() : 
            `<span style="color:#e63946">Команда не намерена. Опитай "help"</span>`;
        
        if (response) addLine(response);
        input.value = '';
    }
});

// Стартово съобщение
setTimeout(() => {
    addLine('<span style="color:#0f0">╭────────────────────────────────────╮</span>');
    addLine('<span style="color:#0f0">│  RAYKOV.TERMINAL v69.420 LOADED    │</span>');
    addLine('<span style="color:#0f0">╰────────────────────────────────────╯</span>');
    addLine('Напиши <span style="color:#e63946">help</span> за начало');
}, 500);