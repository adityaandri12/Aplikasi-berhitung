(function () {
  "use strict";

  var TOTAL_QUESTIONS = 10;
  var PRAISE = ["Hebat!", "Pintar!", "Betul sekali!", "Keren!", "Mantap!", "Luar biasa!"];
  var ENCOURAGE = ["Coba lagi ya!", "Hampir! Ayo coba lagi", "Tidak apa-apa, coba lagi!"];
  var FRUITS = ["🍎", "🍓", "🍌", "🐟", "🌟", "🎈", "🐞", "🍪"];

  var state = {
    mode: "tambah",   // tambah | kurang | campur
    max: 10,          // 10 atau 20
    index: 0,
    score: 0,
    current: null,
    triedWrong: false,
    locked: false
  };

  // ---------- util ----------
  function $(id) { return document.getElementById(id); }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[rand(0, arr.length - 1)]; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rand(0, i);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function showScreen(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove("active");
    $("screen-" + name).classList.add("active");
  }

  // ---------- suara sederhana (tanpa file) ----------
  var audioCtx = null;
  function tone(freqs, dur) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var t = audioCtx.currentTime;
      freqs.forEach(function (f, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t + i * dur);
        gain.gain.exponentialRampToValueAtTime(0.2, t + i * dur + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t + i * dur);
        osc.stop(t + (i + 1) * dur);
      });
    } catch (e) { /* suara opsional */ }
  }
  function soundCorrect() { tone([523, 659, 784], 0.12); }
  function soundWrong() { tone([300, 220], 0.15); }

  // ---------- skor terbaik ----------
  function bestKey() { return "berhitung-best-" + state.mode + "-" + state.max; }
  function getBest() {
    try { return parseInt(localStorage.getItem(bestKey()), 10) || 0; } catch (e) { return 0; }
  }
  function setBest(v) {
    try { localStorage.setItem(bestKey(), String(v)); } catch (e) { /* abaikan */ }
  }
  function renderBest() {
    var b = getBest();
    $("best-score").textContent = b > 0 ? "Skor terbaikmu di sini: " + b + " dari " + TOTAL_QUESTIONS + " ⭐" : "";
  }

  // ---------- pembuatan soal ----------
  function makeQuestion() {
    var op = state.mode === "campur" ? pick(["+", "-"]) : (state.mode === "tambah" ? "+" : "-");
    var max = state.max;
    var a, b, answer;
    if (op === "+") {
      answer = rand(2, max);          // hasil tidak lebih dari batas
      a = rand(1, answer - 1);
      b = answer - a;
    } else {
      a = rand(2, max);               // hasil tidak pernah negatif
      b = rand(1, a - 1);
      answer = a - b;
    }
    return { a: a, b: b, op: op, answer: answer, choices: makeChoices(answer, max) };
  }

  function makeChoices(answer, max) {
    var set = {};
    set[answer] = true;
    var list = [answer];
    var tries = 0;
    while (list.length < 4 && tries < 100) {
      tries++;
      var c = answer + rand(-3, 3);
      if (c < 0 || c > max || set[c]) continue;
      set[c] = true;
      list.push(c);
    }
    var n = 0;
    while (list.length < 4) { if (!set[n]) { set[n] = true; list.push(n); } n++; }
    return shuffle(list);
  }

  // ---------- tampilan soal ----------
  function renderQuestion() {
    var q = state.current;
    var opSymbol = q.op === "+" ? "+" : "−";
    var opClass = q.op === "+" ? "op-plus" : "op-minus";
    $("question").innerHTML =
      q.a + ' <span class="' + opClass + '">' + opSymbol + "</span> " + q.b +
      ' = <span class="q-mark">?</span>';
    $("question-no").textContent = "Soal " + (state.index + 1) + " dari " + TOTAL_QUESTIONS;
    $("progress-bar").style.width = (state.index / TOTAL_QUESTIONS * 100) + "%";
    $("score").textContent = state.score;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    renderVisual(q);

    var box = $("answers");
    box.innerHTML = "";
    q.choices.forEach(function (c) {
      var btn = document.createElement("button");
      btn.className = "answer";
      btn.textContent = c;
      btn.addEventListener("click", function () { onAnswer(btn, c); });
      box.appendChild(btn);
    });
  }

  // Gambar bantu: hanya untuk angka kecil (sampai 10) agar mudah dihitung
  function renderVisual(q) {
    var el = $("visual");
    if (q.a > 10 || q.b > 10) { el.innerHTML = ""; return; }
    var icon = pick(FRUITS);
    var html = "";
    if (q.op === "+") {
      var icon2 = pick(FRUITS.filter(function (f) { return f !== icon; }));
      html = repeat(icon, q.a) + '<span class="sep">+</span>' + repeat(icon2, q.b);
    } else {
      html = repeat(icon, q.a - q.b) + '<span class="gone">' + repeat(icon, q.b) + "</span>";
    }
    el.innerHTML = html;
  }
  function repeat(s, n) { var r = ""; for (var i = 0; i < n; i++) r += s; return r; }

  function onAnswer(btn, value) {
    if (state.locked) return;
    var q = state.current;
    if (value === q.answer) {
      state.locked = true;
      if (!state.triedWrong) state.score++;
      $("score").textContent = state.score;
      btn.classList.add("correct");
      $("question").innerHTML = $("question").innerHTML.replace(
        '<span class="q-mark">?</span>', '<span class="q-mark">' + q.answer + "</span>");
      $("feedback").textContent = pick(PRAISE) + " 🎉";
      $("feedback").className = "feedback good";
      disableAll();
      soundCorrect();
      setTimeout(nextQuestion, 1300);
    } else {
      state.triedWrong = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      $("feedback").textContent = pick(ENCOURAGE) + " 💪";
      $("feedback").className = "feedback bad";
      soundWrong();
    }
  }

  function disableAll() {
    var btns = $("answers").querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
  }

  // ---------- alur permainan ----------
  function startGame() {
    state.index = 0;
    state.score = 0;
    showScreen("quiz");
    loadQuestion();
  }

  function loadQuestion() {
    state.current = makeQuestion();
    state.triedWrong = false;
    state.locked = false;
    renderQuestion();
  }

  function nextQuestion() {
    state.index++;
    if (state.index >= TOTAL_QUESTIONS) finishGame();
    else loadQuestion();
  }

  function finishGame() {
    $("progress-bar").style.width = "100%";
    var s = state.score;
    var stars = s >= 9 ? 3 : s >= 6 ? 2 : s >= 3 ? 1 : 0;
    var titles = ["Ayo berlatih lagi!", "Bagus!", "Hebat!", "Luar biasa!"];
    $("result-title").textContent = titles[stars];

    var starHtml = "";
    for (var i = 0; i < 3; i++) {
      starHtml += '<span class="' + (i < stars ? "" : "dim") + '" style="animation-delay:' + (i * 0.2) + 's">⭐</span>';
    }
    $("result-stars").innerHTML = starHtml;

    var text = "Kamu benar " + s + " dari " + TOTAL_QUESTIONS + " soal.";
    if (s > getBest()) {
      if (getBest() > 0) text += " Rekor baru! 🏆";
      setBest(s);
    }
    $("result-text").textContent = text;
    showScreen("result");
    if (stars >= 2) soundCorrect();
  }

  // ---------- pilihan di layar awal ----------
  function setupChoices(containerId, onPick) {
    var buttons = $(containerId).querySelectorAll(".choice");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (e) {
        for (var j = 0; j < buttons.length; j++) buttons[j].classList.remove("selected");
        e.currentTarget.classList.add("selected");
        onPick(e.currentTarget);
        renderBest();
      });
    }
  }

  setupChoices("mode-choices", function (b) { state.mode = b.getAttribute("data-mode"); });
  setupChoices("level-choices", function (b) { state.max = parseInt(b.getAttribute("data-max"), 10); });

  $("btn-start").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", startGame);
  $("btn-menu").addEventListener("click", function () { renderBest(); showScreen("start"); });
  $("btn-home").addEventListener("click", function () { renderBest(); showScreen("start"); });

  renderBest();
})();
