let flashcards = [];
let currentIndex = 0;
let answered = false;
let selectedAnswers = new Set();   // Stores user's current selections

// DOM elements
const card = document.getElementById("card");
const front = card.querySelector(".front");
const back = card.querySelector(".back");

document.getElementById("next").disabled = true;
document.getElementById("prev").disabled = true;

// Load JSON
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    flashcards = [
      ...data.reglamentacion.map(q => ({ ...q, categoria: "Reglamentación" })),
      ...data.tecnica.map(q => ({ ...q, categoria: "Técnica" }))
    ];

    // Shuffle
    for (let i = flashcards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }

    if (flashcards.length === 0) {
      alert("No questions loaded");
      return;
    }

    document.getElementById("next").disabled = false;
    document.getElementById("prev").disabled = false;

    showCard();
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    alert("Error loading data.json");
  });

// Show card
function showCard() {
  const q = flashcards[currentIndex];
  if (!q) return;

  answered = false;
  selectedAnswers.clear();

  front.innerHTML = `
    <strong>${q.categoria} #${q.numero}</strong><br><br>
    <div>${q.pregunta}</div>
    <br>

    ${Object.entries(q.opciones)
      .map(([key, val]) => `
        <button class="option" data-key="${key}">
          <b>${key.toUpperCase()}</b>: ${val}
        </button>
      `)
      .join("")}

    <br><br>
    <button id="check-btn" class="check-button">Verificar Respuestas</button>
    <p id="feedback"></p>
  `;

  back.innerHTML = "";
  card.classList.remove("flipped");

  const options = document.querySelectorAll(".option");
  const checkBtn = document.getElementById("check-btn");
  const feedback = document.getElementById("feedback");

  // Toggle selection on click
  options.forEach(btn => {
    btn.onclick = () => {
      if (answered) return;

      const key = btn.dataset.key;

      if (selectedAnswers.has(key)) {
        selectedAnswers.delete(key);
        btn.classList.remove("selected");
      } else {
        selectedAnswers.add(key);
        btn.classList.add("selected");
      }
    };
  });

  // Check answers button
  checkBtn.onclick = () => {
    if (answered || selectedAnswers.size === 0) return;
    answered = true;

    const correctSet = new Set(q.respuesta);

    // Highlight all options
    options.forEach(btn => {
      const key = btn.dataset.key;
      btn.disabled = true;

      if (correctSet.has(key) && selectedAnswers.has(key)) {
        btn.classList.add("correct");           // correctly selected
      } 
      else if (correctSet.has(key)) {
        btn.classList.add("correct");           // correct but not selected
      } 
      else if (selectedAnswers.has(key)) {
        btn.classList.add("wrong");             // wrongly selected
      }
    });

    // Feedback
    const isCorrect = 
      selectedAnswers.size === correctSet.size && 
      [...selectedAnswers].every(ans => correctSet.has(ans));

    if (isCorrect) {
      feedback.textContent = "✅ ¡Excelente! Respuesta correcta";
      feedback.className = "correct";
    } else {
      feedback.innerHTML = `
        ❌ Incorrecto<br>
        <small>Las respuestas correctas son: <strong>${q.respuesta.map(r => r.toUpperCase()).join(", ")}</strong></small>
      `;
      feedback.className = "wrong";
    }

    checkBtn.disabled = true;
  };
}

// Navigation
document.getElementById("next").onclick = () => {
  currentIndex = (currentIndex + 1) % flashcards.length;
  showCard();
};

document.getElementById("prev").onclick = () => {
  currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
  showCard();
};