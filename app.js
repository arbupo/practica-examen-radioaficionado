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

    // 🔀 Mezclar preguntas (Fisher-Yates shuffle simple)
    for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }

    if (flashcards.length === 0) {
      alert("No questions loaded");
      return;
    }

    // Enable buttons AFTER load
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

  let answered = false;

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

      if (selected === q.respuesta) {
        btn.classList.add("correct");

        // ✅ feedback positivo
        feedback.textContent = "✅ Correcto";
        feedback.className = "correct";
      } else {
        btn.classList.add("wrong");

        // ❌ feedback negativo
        feedback.textContent = "❌ Incorrecto";
        feedback.className = "wrong";

        // mostrar correcta
        options.forEach(b => {
          if (b.dataset.key === q.respuesta) {
            b.classList.add("correct");
          }
        });
      }

      // desactivar botones
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