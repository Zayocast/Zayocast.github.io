var $progressValue = 0;
var resultList = [];


const quizdata = [
  {
    question: "Кои са основните цветове  ?",
    options: ["Жълто,Виолетово,Синьо", "Синьо,Жълто,Червено", "Зелено,Оранжево,Синьо"],
    answer: "Синьо,Жълто,Червено",
    category: 1
  },
  {
    question: "Защо цъфти косата?",
    options: ["Третиране", "Насища се с кислород", "Старее",],
    answer: "Старее",
    category: 2
  },
  {
    question: "Колко квадрата са нужни за отваряне на салон?",
    options: ["6", "9", "3", "11"],
    answer: "9",
    category: 3
  },
  {
    question: "Кои са институциите за проверка на фризьорски салони ?",
    options: ["РЗИ-НАП", "РЗИ-НАП-РСПАБ", "МВР-КЗП-НАП",],
    answer: "РЗИ-НАП",
    category: 1
  },
  {
    question: "Кое от изброените отваря косъма",
    options: ["Боя", "Оксидант", "Шампоан", "Балсам"],
    answer: "Боя",
    category: 2
  },
  {
    question: "Какво представлява дуално боядисване ?",
    options: ["Амонячна и безамонячна боя", "Безамонячна боя с амоняк", "Тъмен корен и светли краища",],
    answer: "Амонячна и безамонячна боя",
    category: 3
  },
  {
    question: "Къде е произлязло къдренето? ",
    options: ["Египет", "Русия", "Китай","Япония","Бразилия"],
    answer: "Египет",
    category: 3
  },
  {
    question: "Кое pH е неутрално?",
    options: ["7pH", "14pH", "0pH"],
    answer: "7pH",
    category: 3
  },
  {
    question: "Кое pH е алкално?",
    options: ["По-малко от 7pH", "По-голямо от 7pH", "4pH"],
    answer: "По-голямо от 7pH",
    category: 3
  },
  {
    question: "Кое pH е киселино?",
    options: ["По-малко от 7pH", "=7pH", "По-голямо от 7pH"],
    answer: "По-малко от 7pH",
    category: 3
  },
  {
    question: "Меланина отговаря за ?",
    options: ["Цвета на косата,кожата,очите", "Здравината на косъма", "Гъвкавост на косъма"],
    answer: "Цвета на косата,кожата,очите",
    category: 3
  },
  {
    question: "Кератина отговаря за ?",
    options: ["Цвета на косата,кожата,очите", "Здравината на косата и еластичност", "За натрупване на кислорд в косъма"],
    answer: "Здравината на косата и еластичност",
    category: 3
  },
  {
    question: "Кои са вторичните цветове ?",
    options: ["Син,Жълт,Зелен", "Червен,син,Виолетов", "Оранжев,Зелен,Виолетов"],
    answer: "Оранжев,Зелен,Виолетов",
    category: 3
  },
  {
    question: "Когато се смесят трите основни цвята се получава ?",
    options: ["Кафяво", "Черно", "Бяло"],
    answer: "Кафяво",
    category: 3
  },
  {
    question: "Химичен състав на косъма ?",
    options: ["Калций,Водород,Калий,Сяра,Кислород", "Въглерод,Кислород,Азот,Водород,Сяра", "Магнезий,Въглерод,Калций,Хром,Азот"],
    answer: "Въглерод,Кислород,Азот,Водород,Сяра",
    category: 3
  },
  {
    question: "Топли цветове са ?",
    options: ["Виолет,Червен,Зелен", "Син,Виолет,Червен", "Оранжево,Червено,Жълто"],
    answer: "Оранжево,Червено,Жълто",
    category: 3
  },
  {
    question: "Студени цветове са ?",
    options: ["Виолетов,Син,Зелен", "Виолетов,Червен,Оранжев", "Син,Зелен,Жълт"],
    answer: "Виолетов,Син,Зелен",
    category: 3
  },

  {
    question: "Колко минути се стои с къдрина?",
    options: ["45мин.", "Определя се според състоянието на косата","10мин.",],
    answer: "Определя се според състоянието на косата",
    category: 3
  },
  {
    question: "Колко време се стои с фиксажа?",
    options: ["10мин.", "45мин.","15мин.",],
    answer: "10мин.",
    category: 3
  },
  {
    question: "Какво се случва с косата по време на къдрене?",
    options: ["Променя се структурата на косъма", "Подхранва се","Насища се с кислород",],
    answer: "Променя се структурата на косъма",
    category: 3
  },
  {
    question: "Какво представлява коректорът?",
    options: ["Неотрализира или подсилва цвета", "Подхранва косата при боядисване","Ламинира косъма",],
    answer: "Неотрализира или подсилва цвета",
    category: 3
  },
  {
    question: "Колко минути се стои с амонячна боя?",
    options: ["45мин.", "30мин.","10мин.",],
    answer: "30мин.",
    category: 3
  },
  {
    question: "Колко време се стои с безамонячна боя? ",
    options: ["35мин.", "60мин.","45мин.",],
    answer: "45мин.",
    category: 3
  },
  {
    question: "Колко време се стои с мъжка боя за коса?",
    options: ["10мин.", "15мин.","30мин.",],
    answer: "10мин.",
    category: 3
  },
  {
    question: "Какво означава ламиниране на косата?",
    options: ["Обиране на цъфтежа", "Възтановяване структурата на косъма,чрез терапия",],
    answer: "Възтановяване структурата на косъма,чрез терапия",
    category: 3
  },

];
/** Random shuffle questions **/
function shuffleArray(question) {
  var shuffled = question.sort(function () {
    return .5 - Math.random();
  });
  return shuffled;
}

function shuffle(a) {
  for (var i = a.length; i; i--) {
    var j = Math.floor(Math.random() * i);
    var _ref = [a[j], a[i - 1]];
    a[i - 1] = _ref[0];
    a[j] = _ref[1];
  }
}

/*** Return shuffled question ***/
function generateQuestions() {
  var questions = shuffleArray(quizdata);
  return questions;
}

/*** Return list of options ***/
function returnOptionList(opts, i) {

  var optionHtml = '<li class="myoptions">' +
    '<input value="' + opts + '" name="optRdBtn" type="radio" id="rd_' + i + '">' +
    '<label for="rd_' + i + '">' + opts + '</label>' +
    '<div class="bullet">' +
    '<div class="line zero"></div>' +
    '<div class="line one"></div>' +
    '<div class="line two"></div>' +
    '<div class="line three"></div>' +
    '<div class="line four"></div>' +
    '<div class="line five"></div>' +
    '<div class="line six"></div>' +
    '<div class="line seven"></div>' +
    '</div>' +
    '</li>';

  return optionHtml;
}




















function returnOptionList2(opts, i) {

  var optionHtml = '<li class="myoptions">' +
    '<input value="' + opts + '" name="optRdBtn" type="textarea" id="rd_' + i + '">' +
    '<label for="rd_' + i + '">' + opts + '</label>' +
    '<div class="bullet">' +
    '<div class="line zero"></div>' +
    '<div class="line one"></div>' +
    '<div class="line two"></div>' +
    '<div class="line three"></div>' +
    '<div class="line four"></div>' +
    '<div class="line five"></div>' +
    '<div class="line six"></div>' +
    '<div class="line seven"></div>' +
    '</div>' +
    '</li>';

  return optionHtml;
}


























/** Render Options **/
function renderOptions(optionList) {
  var ulContainer = $('<ul>').attr('id', 'optionList');
  for (var i = 0, len = optionList.length; i < len; i++) {
    var optionContainer = returnOptionList(optionList[i], i)
    ulContainer.append(optionContainer);
  }
  $(".answerOptions").html('').append(ulContainer);
}

/** Render question **/
function renderQuestion(question) {
  $(".question").html("<h1>" + question + "</h1>");
}

/** Render quiz :: Question and option **/
function renderQuiz(questions, index) {
  var currentQuest = questions[index];
  renderQuestion(currentQuest.question);
  renderOptions(currentQuest.options);
  console.log("Question");
  console.log(questions[index]);
}

/** Return correct answer of a question ***/
function getCorrectAnswer(questions, index) {
  return questions[index].answer;
}

/** pushanswers in array **/
function correctAnswerArray(resultByCat) {
  var arrayForChart = [];
  for (var i = 0; i < resultByCat.length; i++) {
    arrayForChart.push(resultByCat[i].correctanswer);
  }

  return arrayForChart;
}
/** Generate array for percentage calculation **/
function genResultArray(results, wrong) {
  var resultByCat = resultByCategory(results);
  var arrayForChart = correctAnswerArray(resultByCat);
  arrayForChart.push(wrong);
  return arrayForChart
}

/** percentage Calculation **/
function percentCalculation(array, total) {
  var percent = array.map(function (d, i) {
    return (100 * d / total).toFixed(2);
  });
  return percent;
}

/*** Get percentage for chart **/
function getPercentage(resultByCat, wrong) {
  var totalNumber = resultList.length;
  var wrongAnwer = wrong;
  //var arrayForChart=genResultArray(resultByCat, wrong);
  //return percentCalculation(arrayForChart, totalNumber);
}

/** count right and wrong answer number **/
function countAnswers(results) {

  var countCorrect = 0, countWrong = 0;

  for (var i = 0; i < results.length; i++) {
    if (results[i].iscorrect == true)
      countCorrect++;
    else countWrong++;
  }

  return [countCorrect, countWrong];
}

/**** Categorize result *****/
function resultByCategory(results) {

  var categoryCount = [];
  var ctArray = results.reduce(function (res, value) {
    if (!res[value.category]) {
      res[value.category] = {
        category: value.category,
        correctanswer: 0
      };
      categoryCount.push(res[value.category])
    }
    var val = (value.iscorrect == true) ? 1 : 0;
    res[value.category].correctanswer += val;
    return res;
  }, {});

  categoryCount.sort(function (a, b) {
    return a.category - b.category;
  });

  return categoryCount;
}


/** Total score pie chart**/
function totalPieChart(_upto, _cir_progress_id, _correct, _incorrect) {

  $("#" + _cir_progress_id).find("._text_incor").html("Грешни : " + _incorrect);
  $("#" + _cir_progress_id).find("._text_cor").html("Правилни : " + _correct);

  var unchnagedPer = _upto;

  _upto = (_upto > 100) ? 100 : ((_upto < 0) ? 0 : _upto);

  var _progress = 0;

  var _cir_progress = $("#" + _cir_progress_id).find("._cir_P_y");
  var _text_percentage = $("#" + _cir_progress_id).find("._cir_Per");

  var _input_percentage;
  var _percentage;

  var _sleep = setInterval(_animateCircle, 25);

  function _animateCircle() {
    //2*pi*r == 753.6 +xxx=764
    _input_percentage = (_upto / 100) * 764;
    _percentage = (_progress / 100) * 764;

    _text_percentage.html(_progress + '%');

    if (_percentage >= _input_percentage) {
      _text_percentage.html('<tspan x="50%" dy="0em">' + unchnagedPer + '% </tspan><tspan  x="50%" dy="1.9em">Резултат в проценти</tspan>');
      clearInterval(_sleep);
    } else {

      _progress++;

      _cir_progress.attr("stroke-dasharray", _percentage + ',764');
    }
  }
}

function renderBriefChart(correct, total, incorrect) {
  var percent = (100 * correct / total);
  if (Math.round(percent) !== percent) {
    percent = percent.toFixed(2);
  }

  totalPieChart(percent, '_cir_progress', correct, incorrect)

}
/*** render chart for result **/
function renderChart(data) {
  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ["Verbal communication",
        "Non-verbal communication",
        "Written communication",
        "Incorrect"
      ],
      datasets: [
        {

          data: data,
          backgroundColor: ['#e6ded4',
            '#968089',
            '#e3c3d4',
            '#ab4e6b'
          ],
          borderColor: ['rgba(239, 239, 81, 1)',
            '#8e3407',
            'rgba((239, 239, 81, 1)',
            '#000000'
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      pieceLabel: {
        render: 'percentage',
        fontColor: 'black',
        precision: 2
      }
    }

  });
}

/** List question and your answer and correct answer  

*****/
function getAllAnswer(results) {
  var innerhtml = "";
  for (var i = 0; i < results.length; i++) {

    var _class = ((results[i].iscorrect) ? "item-correct" : "item-incorrect");
    var _classH = ((results[i].iscorrect) ? "h-correct" : "h-incorrect");


    var _html = '<div class="_resultboard ' + _class + '">' +
      '<div class="_header">' + results[i].question + '</div>' +
      '<div class="_yourans ' + _classH + '">' + results[i].clicked + '</div>';

    var html = "";
    if (!results[i].iscorrect)
      html = '<div class="_correct">' + results[i].answer + '</div>';
    _html = (_html + html) + '</div>';
    innerhtml += _html;
  }

  $(".allAnswerBox").html('').append(innerhtml);
}
/** render  Brief Result **/
function renderResult(resultList) {

  var results = resultList;
  console.log(results);
  var countCorrect = countAnswers(results)[0],
    countWrong = countAnswers(results)[1];


  renderBriefChart(countCorrect, resultList.length, countWrong);
}

function renderChartResult() {
  var results = resultList;
  var countCorrect = countAnswers(results)[0],
    countWrong = countAnswers(results)[1];
  var dataForChart = genResultArray(resultList, countWrong);
  renderChart(dataForChart);
}

/** Insert progress bar in html **/
function getProgressindicator(length) {
  var progressbarhtml = " ";
  for (var i = 0; i < length; i++) {
    progressbarhtml += '<div class="my-progress-indicator progress_' + (i + 1) + ' ' + ((i == 0) ? "active" : "") + '"></div>';
  }
  $(progressbarhtml).insertAfter(".my-progress-bar");
}

/*** change progress bar when next button is clicked ***/
function changeProgressValue() {
  $progressValue += 9;
  if ($progressValue >= 100) {

  } else {
    if ($progressValue == 99) $progressValue = 100;
    $('.my-progress')
      .find('.my-progress-indicator.active')
      .next('.my-progress-indicator')
      .addClass('active');
    $('progress').val($progressValue);
  }
  $('.js-my-progress-completion').html($('progress').val() + '% complete');

}
function addClickedAnswerToResult(questions, presentIndex, clicked) {
  var correct = getCorrectAnswer(questions, presentIndex);
  var result = {
    index: presentIndex,
    question: questions[presentIndex].question,
    clicked: clicked,
    iscorrect: (clicked == correct) ? true : false,
    answer: correct,
    category: questions[presentIndex].category
  }
  resultList.push(result);

  console.log("result");
  console.log(result);

}

$(document).ready(function () {

  var presentIndex = 0;
  var clicked = 0;

  var questions = generateQuestions();
  renderQuiz(questions, presentIndex);
  getProgressindicator(questions.length);

  $(".answerOptions ").on('click', '.myoptions>input', function (e) {
    clicked = $(this).val();

    if (questions.length == (presentIndex + 1)) {
      $("#submit").removeClass('hidden');
      $("#next").addClass("hidden");
    }
    else {

      $("#next").removeClass("hidden");
    }



  });



  $("#next").on('click', function (e) {
    e.preventDefault();
    addClickedAnswerToResult(questions, presentIndex, clicked);

    $(this).addClass("hidden");

    presentIndex++;
    renderQuiz(questions, presentIndex);
    changeProgressValue();
  });

  $("#submit").on('click', function (e) {
    addClickedAnswerToResult(questions, presentIndex, clicked);
    $('.multipleChoiceQues').hide();
    $(".resultArea").show();
    renderResult(resultList);

  });




  $(".resultArea").on('click', '.viewchart', function () {
    $(".resultPage2").show();
    $(".resultPage1").hide();
    $(".resultPage3").hide();
    renderChartResult();
  });

  $(".resultArea").on('click', '.backBtn', function () {
    $(".resultPage1").show();
    $(".resultPage2").hide();
    $(".resultPage3").hide();
    renderResult(resultList);
  });

  $(".resultArea").on('click', '.viewanswer', function () {
    $(".resultPage3").show();
    $(".resultPage2").hide();
    $(".resultPage1").hide();
    getAllAnswer(resultList);
  });

  $(".resultArea").on('click', '.replay', function () {
    window.location.reload(true);
  });

});