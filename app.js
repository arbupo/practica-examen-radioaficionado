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

  let answered = false; // 🔒 control de respuesta

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
  `;

  back.innerHTML = "";
  card.classList.remove("flipped");

  // click logic
  document.querySelectorAll(".option").forEach(btn => {
    btn.onclick = () => {
      if (answered) return; // 🚫 bloquea más clicks
      answered = true;

      const selected = btn.dataset.key;

      if (selected === q.respuesta) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");

        // mostrar correcta
        document.querySelectorAll(".option").forEach(b => {
          if (b.dataset.key === q.respuesta) {
            b.classList.add("correct");
          }
        });
      }

      // 🔒 opcional: desactivar botones completamente
      document.querySelectorAll(".option").forEach(b => {
        b.disabled = true;
      });
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