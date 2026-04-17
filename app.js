// ======================== CONFIGURACIÓN ========================
let allFlashcards = [];
let currentFlashcards = [];
let currentIndex = 0;
let currentLevel = "novicio";
let answered = false;

// DOM elements
const card = document.getElementById("card");
const front = card.querySelector(".front");

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const checkBtn = document.getElementById("check-button");

prevBtn.disabled = true;
nextBtn.disabled = true;

// ======================== FUNCIÓN DE MEZCLA ========================
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ======================== FILTRADO POR NIVEL ========================
function loadLevel(level) {
    currentLevel = level;

    currentFlashcards = allFlashcards.filter(q => {
        if (!q || !q.numero) return false;
        const num = q.numero.trim();
        const isRoman = !num.startsWith("P");
        const isPB = num.startsWith("PB.");
        let isSpecific = false;
        if (level === "novicio") isSpecific = num.startsWith("PBN.");
        else if (level === "general") isSpecific = num.startsWith("PBG.");
        else if (level === "superior") isSpecific = num.startsWith("PBS.");
        return isRoman || isPB || isSpecific;
    });

    currentFlashcards = shuffle(currentFlashcards);
    currentIndex = 0;

    document.getElementById("question-count").textContent = currentFlashcards.length;

    if (currentFlashcards.length === 0) {
        alert(`No hay preguntas disponibles para el nivel ${level.toUpperCase()}`);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    prevBtn.disabled = false;
    nextBtn.disabled = false;
    showCard();
}

// ======================== MOSTRAR PREGUNTA ========================
function showCard() {
    const q = currentFlashcards[currentIndex];
    if (!q) return;

    answered = false;

    const optionsHTML = Object.entries(q.opciones)
        .map(([key, val]) => `
            <button class="option" data-key="${key}">
                <b>${key.toUpperCase()}</b>: ${val}
            </button>
        `).join("");

    front.innerHTML = `
        <strong>${q.categoria} #${q.numero}</strong><br><br>
        <div style="font-size:1.1rem; line-height:1.4;">${q.pregunta}</div>
        <br>
        ${optionsHTML}
        <p id="feedback" style="margin-top:20px; font-size:1.3rem; text-align:center;"></p>
    `;

    const options = front.querySelectorAll(".option");
    const feedback = front.querySelector("#feedback");

    let selectedAnswers = new Set();

    // Selección múltiple
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

    // ======================== BOTÓN CONFIRMAR (ahora en la barra inferior) ========================
    checkBtn.disabled = false;
    checkBtn.onclick = () => {
        if (answered || selectedAnswers.size === 0) return;

        answered = true;

        const selectedArray = Array.from(selectedAnswers).sort();
        const correctArray = [...q.respuesta].sort();
        const isCorrect = JSON.stringify(selectedArray) === JSON.stringify(correctArray);

        // Marcar respuestas
        options.forEach(btn => {
            const key = btn.dataset.key;
            const isSelected = selectedAnswers.has(key);
            const isCorrectOption = q.respuesta.includes(key);

            if (isCorrectOption) btn.classList.add("correct");
            else if (isSelected) btn.classList.add("wrong");
            btn.disabled = true;
        });

        if (isCorrect) {
            feedback.innerHTML = "✅ <strong>¡Correcto!</strong>";
            feedback.className = "correct";
        } else {
            feedback.innerHTML = "❌ <strong>Incorrecto</strong><br><small>Las respuestas correctas están marcadas en verde.</small>";
            feedback.className = "wrong";
        }

        checkBtn.disabled = true;
    };

    // Resetear botón Confirmar cada vez que se cambia de pregunta
    checkBtn.disabled = false;
}

// ======================== CARGA DE DATOS ========================
fetch("data.json")
    .then(res => res.json())
    .then(data => {
        allFlashcards = [
            ...(data.reglamentacion || []).map(q => ({ ...q, categoria: "Reglamentación" })),
            ...(data.tecnica || []).map(q => ({ ...q, categoria: "Técnica" }))
        ];
        loadLevel("novicio");
    })
    .catch(err => {
        console.error("Error cargando data.json:", err);
        alert("Error al cargar data.json");
    });

// ======================== NAVEGACIÓN ========================
nextBtn.onclick = () => {
    if (currentFlashcards.length === 0) return;
    currentIndex = (currentIndex + 1) % currentFlashcards.length;
    showCard();
};

prevBtn.onclick = () => {
    if (currentFlashcards.length === 0) return;
    currentIndex = (currentIndex - 1 + currentFlashcards.length) % currentFlashcards.length;
    showCard();
};

// ======================== CAMBIO DE NIVEL ========================
document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadLevel(btn.dataset.level);
    });
});