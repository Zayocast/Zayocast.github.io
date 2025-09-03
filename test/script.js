let questions = [
    {
        question: "Какво е pH на човешката коса? 💇‍♀️",
        options: ["4.5-5.5", "6.5-7.5", "8.5-9.5", "10.5-11.5"],
        correct: 0
    },
    {
        question: "Кой инструмент се използва за къдрене? ✂️",
        options: ["Ножица", "Машинка", "Преса за къдрици", "Сешоар"],
        correct: 2
    },
    {
        question: "Какво е трихология? 🔬",
        options: ["Наука за косата", "Наука за ноктите", "Наука за кожата", "Наука за зъбите"],
        correct: 0
    },
    {
        question: "Колко слоя има косъмът? 🧬",
        options: ["1", "2", "3", "4"],
        correct: 2
    },
    {
        question: "Какво е балсам за коса? 🧴",
        options: ["Почиства", "Хидратира", "Боядисва", "Подстригва"],
        correct: 1
    },
    {
        question: "Какво е трихотиломания? 😟",
        options: ["Компулсивно скубане на коса", "Изтъняване на косата", "Боядисване на коса", "Къдрене на коса"],
        correct: 0
    },
    {
        question: "Кой тип коса има най-малко пигмент? 🌈",
        options: ["Блондин", "Брюнет", "Червен", "Сив"],
        correct: 0
    },
    {
        question: "Какво е порозност на косата? 💧",
        options: ["Способността да абсорбира влага", "Цвят на косата", "Дължина на косата", "Форма на косъма"],
        correct: 0
    },
    {
        question: "Какво е finger waving? 👋",
        options: ["Формиране на S-образни вълни с пръсти", "Подстригване с ножица", "Боядисване", "Изправяне"],
        correct: 0
    },
    {
        question: "Кой инструмент не се използва за рязане на коса? ✂️",
        options: ["Ножица", "Бръснач", "Гребен", "Машинка"],
        correct: 2
    },
    {
        question: "Какво е кератин? 🧪",
        options: ["Протеин в косата", "Цвят", "Шампоан", "Инструмент"],
        correct: 0
    },
    {
        question: "Колко фази има цикълът на растеж на косата? 🌱",
        options: ["2", "3", "4", "5"],
        correct: 1
    },
    {
        question: "Какво е алопеция? 👩‍🦲",
        options: ["Косопад", "Къдрене", "Боядисване", "Хидратация"],
        correct: 0
    },
    {
        question: "Кой е най-добрият начин за сушене на коса? 🌬️",
        options: ["С кърпа", "С сешоар на ниска температура", "На слънце", "С преса"],
        correct: 1
    },
    {
        question: "Какво е омбре? 🎨",
        options: ["Градиентно боядисване", "Пълно боядисване", "Подстригване", "Къдрене"],
        correct: 0
    },
    {
        question: "Кои са основните цветове? 🌈",
        options: ["жълт, виолетов, син", "син, жълт, червен", "зелен, оранжев, син"],
        correct: 1
    },
    {
        question: "Кои цветове са топли? 🔥",
        options: ["жълт, виолетов, червен", "син, червен, жълт", "червен, оранжев, жълт"],
        correct: 2
    },
    {
        question: "При смесването на равни части от кои цветове ще получим неутрален кафяв цвят? 🎨",
        options: ["син, жълт, червен", "виолетов, червен, жълт", "виолетов, зелен, оранжев"],
        correct: 0
    },
    {
        question: "Какво наричаме фон на изсветляване? 💡",
        options: ["новообразувалите се цветове след изсветляването, било то естествено или провокирано", "цветовете преди изсветляване на косата", "козметичната основа, върху която нанасяме избрания цвят"],
        correct: 0
    },
    {
        question: "Защо цъфти косата? 🌸",
        options: ["защото се третира често", "насища се с кислород", "защото старее"],
        correct: 2
    },
    {
        question: "Колко квадрата помещение са нужни за отварянето на фризьорски салон? 🏪",
        options: ["3", "6", "9", "11"],
        correct: 2
    },
    {
        question: "Кои са институциите за проверка на фризьорските салони? 🕵️",
        options: ["РЗИ, НАП", "РЗИ, НАП, РСПАБ", "МВР, КЗП, НАП"],
        correct: 1
    },
    {
        question: "Кое от изброените отваря косъма? 🔓",
        options: ["амоняк", "кислород", "водород", "Нито едно от изброените"],
        correct: 0
    },
    {
        question: "Кое от изброените отговаря за цвета на косата? 🎨",
        options: ["водородни връзки", "кератин", "меланин"],
        correct: 2
    },
    {
        question: "Какво представлява дуалното боядисване? 🖌️",
        options: ["когато боядисваме корена с амонячна, а дължините с безамонячна боя", "когато боядисваме корена с безамонячна, а дължините с амонячна боя", "когато боядисваме корена с тъмна боя, а дължините със светла"],
        correct: 0
    },
    {
        question: "В коя част на косъма се съдържа меланина? 🧬",
        options: ["кутикула", "медула", "кортекс", "Нито едно от изброените"],
        correct: 2
    },
    {
        question: "Какво Ph има оксидантът? ⚗️",
        options: ["алкално", "киселинно", "неутрално"],
        correct: 1
    },
    {
        question: "Как се получават третичните цветове? 🌈",
        options: ["при смесването на два първични цвята", "при смесването на равни части на един първичен и един вторичен цвят", "при смесването на два вторични цвята"],
        correct: 1
    },
    {
        question: "Какво е неутрализация? ⚖️",
        options: ["да съберем трите първични цвята в равни части и да получим кафяв (неутрален цвят)", "да съберем един първичен и един вторичен цвят", "да смесим боя и оксидант"],
        correct: 0
    },
    {
        question: "Кой народ полага основите на съвременното бръснарство? 🪒",
        options: ["арабите", "турците", "римляните", "бразилците"],
        correct: 0
    },
    {
        question: "Кое pH е неутрално? ⚗️",
        options: ["7pH", "14pH", "0pH"],
        correct: 0
    },
    {
        question: "Кое pH е алкално? ⚗️",
        options: ["По-малко от 7pH", "По-голямо от 7pH", "4pH"],
        correct: 1
    },
    {
        question: "Меланина отговаря за? 🎨",
        options: ["Цвета на косата, кожата, очите", "Здравината на косъма", "Гъвкавост на косъма"],
        correct: 0
    },
    {
        question: "Химичен състав на косъма? 🧪",
        options: ["Калций, Водород, Калий, Сяра, Кислород", "Въглерод, Кислород, Азот, Водород, Сяра", "Магнезий, Въглерод, Калций, Хром, Азот"],
        correct: 1
    },
    {
        question: "Колко минути се стои с къдрина? 🌀",
        options: ["45мин.", "Определя се според състоянието на косата", "10мин.", "30мин."],
        correct: 1
    },
    {
        question: "Колко време се стои с фиксажа? ⏱️",
        options: ["10мин.", "45мин.", "15мин."],
        correct: 0
    },
    {
        question: "Какво се случва с косата по време на къдрене? 🌀",
        options: ["Променя се структурата на косъма", "Подхранва се", "Насища се с кислород"],
        correct: 0
    },
    {
        question: "Какво представлява коректорът? 🎨",
        options: ["Неотрализира или подсилва цвета", "Подхранва косата при боядисване", "Ламинира косъма"],
        correct: 0
    },
    {
        question: "Колко минути се стои с амонячна боя? 🖌️",
        options: ["45мин.", "30мин.", "10мин."],
        correct: 1
    },
    {
        question: "Колко време се стои с безамонячна боя? 🖌️",
        options: ["35мин.", "60мин.", "45мин."],
        correct: 2
    },
    {
        question: "Колко време се стои с мъжка боя за коса? 🖌️",
        options: ["10мин.", "16мин.", "30мин."],
        correct: 0
    },
    {
        question: "Какво означава ламиниране на косата? 🛡️",
        options: ["Обиране на цъфтежа", "Възстановяване структурата на косъма, чрез терапия"],
        correct: 1
    }
];

const letters = ['А', 'Б', 'В', 'Г'];

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const adminScreen = document.getElementById('admin-screen');
const adminLoginScreen = document.getElementById('admin-login-screen');

const startBtn = document.getElementById('start-btn');
const adminBtn = document.getElementById('admin-btn');
const backToStart = document.getElementById('back-to-start');
const backToStartFromLogin = document.getElementById('back-to-start-from-login');
const submitPassword = document.getElementById('submit-password');
const questionCount = document.getElementById('question-count');
questionCount.textContent = questions.length;

let shuffledQuestions = [];
let currentQuestion = 0;
let answers = [];

startBtn.addEventListener('click', startQuiz);
adminBtn.addEventListener('click', showAdminLogin);
backToStart.addEventListener('click', showStart);
backToStartFromLogin.addEventListener('click', showStart);
submitPassword.addEventListener('click', async () => {
    const password = document.getElementById('admin-password').value;
    const hashedInput = await hashPassword(password);
    const correctHash = await hashPassword('saloniva11');
    if (hashedInput === correctHash) {
        adminLoginScreen.classList.add('hidden');
        adminScreen.classList.remove('hidden');
        renderQuestionList();
    } else {
        alert('Грешна парола! 🔐');
    }
});

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function startQuiz() {
    shuffledQuestions = shuffle([...questions]);
    answers = new Array(shuffledQuestions.length).fill(null);
    currentQuestion = 0;
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    updateProgress();
    showQuestion();
}

function updateProgress() {
    const answeredCount = answers.filter(a => a !== null).length;
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${(answeredCount / shuffledQuestions.length) * 100}%`;
}

function showQuestion() {
    const questionEl = document.getElementById('question');
    const questionNumberEl = document.getElementById('question-number');
    const optionsEl = document.getElementById('options');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    questionNumberEl.textContent = `Въпрос ${currentQuestion + 1} от ${shuffledQuestions.length}`;
    questionEl.textContent = shuffledQuestions[currentQuestion].question;
    optionsEl.innerHTML = '';
    shuffledQuestions[currentQuestion].options.forEach((opt, i) => {
        const div = document.createElement('div');
        div.classList.add('option');
        div.innerHTML = `<span class="letter">${letters[i]}</span> ${opt}`;
        div.addEventListener('click', () => selectOption(i));
        if (answers[currentQuestion] === i) div.classList.add('selected');
        optionsEl.appendChild(div);
    });

    prevBtn.disabled = currentQuestion === 0;
    nextBtn.textContent = currentQuestion < shuffledQuestions.length - 1 ? 'Напред ➡️' : 'Предаване 📤';
    submitBtn.classList.add('hidden');

    if (currentQuestion === shuffledQuestions.length - 1) {
        submitBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
    } else {
        submitBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    }
}

function selectOption(index) {
    answers[currentQuestion] = index;
    updateProgress();
    showQuestion();
}

document.getElementById('prev-btn').addEventListener('click', () => {
    currentQuestion--;
    showQuestion();
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResults();
    }
});

document.getElementById('submit-btn').addEventListener('click', showResults);

function showResults() {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');

    let correctCount = 0;
    const answersEl = document.getElementById('answers');
    answersEl.innerHTML = '';
    shuffledQuestions.forEach((q, i) => {
        const div = document.createElement('div');
        const isCorrect = answers[i] === q.correct;
        const score = isCorrect ? 1 : 0;
        if (isCorrect) correctCount++;
        div.classList.add('answer-card', isCorrect ? 'correct' : 'incorrect');
        div.innerHTML = `
            <hr>
            <div class="result-question"><span><b>Въпрос ${i + 1}</b></span> &nbsp; ${q.question}</div>
            ${!isCorrect && answers[i] !== null ? `<div><i>Твой отговор:</i> &nbsp; ${letters[answers[i]]}. ${q.options[answers[i]]} ❌</div>` : ''}
            <div><i>Правилен отговор:</i> &nbsp; ${letters[q.correct]}. ${q.options[q.correct]} ${isCorrect ? '✅' : '🎯'}</div>
            <div class="last-row"><b>Точки:</b> &nbsp; <span class="${isCorrect ? 'correct' : 'wrong'}">${score}</span> ${isCorrect ? '✅' : '❌'}</div>
        `;
        answersEl.appendChild(div);
    });

    const total = shuffledQuestions.length;
    const percentCorrect = (correctCount / total * 100).toFixed(2);
    const percentIncorrect = (100 - percentCorrect).toFixed(2);
    document.getElementById('score').textContent = `Резултат: ${correctCount}/${total} (${percentCorrect}% верни ✅ | ${percentIncorrect}% грешни ❌)`;

    // Pie Chart
    const ctx = document.getElementById('result-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Верни', 'Грешни'],
            datasets: [{
                data: [percentCorrect, percentIncorrect],
                backgroundColor: ['#32cd32', '#ff6347'],
                borderColor: ['#228b22', '#ffa07a'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

document.getElementById('restart-btn').addEventListener('click', () => {
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

function showAdminLogin() {
    startScreen.classList.add('hidden');
    adminLoginScreen.classList.remove('hidden');
}

function showStart() {
    adminScreen.classList.add('hidden');
    adminLoginScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    questionCount.textContent = questions.length;
}

function renderQuestionList() {
    const list = document.getElementById('question-list');
    list.innerHTML = '';
    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>${q.question}</p>
            <input type="text" value="${q.question}" id="edit-q-${i}">
            ${q.options.map((opt, j) => `<input type="text" value="${opt}" id="edit-opt-${i}-${j}">`).join('')}
            <input type="number" value="${q.correct + 1}" id="edit-correct-${i}">
            <button onclick="editQuestion(${i})">Редактирай ✏️</button>
            <button onclick="deleteQuestion(${i})">Изтрий 🗑️</button>
        `;
        list.appendChild(div);
    });
}

window.editQuestion = function(index) {
    const q = document.getElementById(`edit-q-${index}`).value;
    const opts = [];
    for (let j = 0; j < 4; j++) {
        const opt = document.getElementById(`edit-opt-${index}-${j}`)?.value;
        if (opt) opts.push(opt);
    }
    const correct = parseInt(document.getElementById(`edit-correct-${index}`).value) - 1;
    questions[index] = { question: q, options: opts, correct };
    renderQuestionList();
}

window.deleteQuestion = function(index) {
    questions.splice(index, 1);
    renderQuestionList();
}

document.getElementById('add-question').addEventListener('click', () => {
    const q = document.getElementById('new-question').value;
    const opts = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value,
        document.getElementById('option4').value
    ].filter(opt => opt);
    const correct = parseInt(document.getElementById('correct-option').value) - 1;
    if (q && opts.length >= 2 && correct >= 0 && correct < opts.length) {
        questions.unshift({ question: q, options: opts, correct });
        renderQuestionList();
        document.getElementById('new-question').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        document.getElementById('option3').value = '';
        document.getElementById('option4').value = '';
        document.getElementById('correct-option').value = '';
    } else {
        alert('Попълни всичко правилно! 📝');
    }
});