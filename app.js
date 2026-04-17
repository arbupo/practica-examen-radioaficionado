let flashcards = [];
let currentIndex = 0;
let answered = false;

// DOM elements
const card = document.getElementById("card");
const front = card.querySelector(".front");
const back = card.querySelector(".back");

// Disable buttons initially
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

    // 🔀 Mezclar preguntas
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

  front.innerHTML = `
    <strong>${q.categoria} #${q.numero}</strong><br><br>
    <div>${q.pregunta}</div>
    <br>

    ${Object.entries(q.opciones)
      .map(([key, val]) => {
        return `
          <button class="option" data-key="${key}">
            <b>${key.toUpperCase()}</b>: ${val}
          </button>
        `;
      })
      .join("")}

    <p id="feedback"></p>
  `;

  back.innerHTML = "";
  card.classList.remove("flipped");

  const options = document.querySelectorAll(".option");
  const feedback = document.getElementById("feedback");

  options.forEach(btn => {
    btn.onclick = () => {
      if (answered) return;
      answered = true;

      const selected = btn.dataset.key;

      if (q.respuesta.includes(selected)) {
        btn.classList.add("correct");

        feedback.textContent = "✅ Correcto";
        feedback.className = "correct";
      } else {
        btn.classList.add("wrong");

        feedback.textContent = "❌ Incorrecto";
        feedback.className = "wrong";
      }

      // Mostrar TODAS las correctas
      options.forEach(b => {
        if (q.respuesta.includes(b.dataset.key)) {
          b.classList.add("correct");
        }
      });

      // Desactivar botones
      options.forEach(b => (b.disabled = true));
    };
  });
}

// Buttons
document.getElementById("next").onclick = () => {
  currentIndex = (currentIndex + 1) % flashcards.length;
  showCard();
};

document.getElementById("prev").onclick = () => {
  currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
  showCard();
};