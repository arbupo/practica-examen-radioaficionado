// ======================== CONFIGURACIÓN ========================
let allFlashcards = [];
let currentFlashcards = [];
let currentIndex = 0;
let currentLevel = "novicio";
let currentCategory = "ambas";   // ← NUEVA VARIABLE
let answered = false;

// DOM elements
const card = document.getElementById("card");
const front = card.querySelector(".front");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const checkBtn = document.getElementById("check-button");

prevBtn.disabled = true;
nextBtn.disabled = true;

// ======================== MEZCLA ========================
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ======================== FILTRADO ========================
function loadQuestions() {
    currentFlashcards = allFlashcards.filter(q => {
        if (!q || !q.numero) return false;

        const num = q.numero.trim();
        const isRoman = !num.startsWith("P");
        const isPB = num.startsWith("PB.");

        // Filtro por nivel
        let matchesLevel = isRoman || isPB;
        if (currentLevel === "novicio") matchesLevel = matchesLevel || num.startsWith("PBN.");
        else if (currentLevel === "general") matchesLevel = matchesLevel || num.startsWith("PBG.");
        else if (currentLevel === "superior") matchesLevel = matchesLevel || num.startsWith("PBS.");

        // Filtro por categoría
        let matchesCategory = true;
        if (currentCategory === "reglamentacion") 
            matchesCategory = q.categoria === "Reglamentación";
        else if (currentCategory === "tecnica") 
            matchesCategory = q.categoria === "Técnica";

        return matchesLevel && matchesCategory;
    });

    currentFlashcards = shuffle(currentFlashcards);
    currentIndex = 0;
    document.getElementById("question-count").textContent = currentFlashcards.length;

    if (currentFlashcards.length === 0) {
        alert(`No hay preguntas disponibles para ${currentLevel.toUpperCase()} + ${currentCategory}`);
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

    // ... (el resto del código de selección múltiple y botón confirmar se mantiene igual)
    const options = front.querySelectorAll(".option");
    const feedback = front.querySelector("#feedback");
    let selectedAnswers = new Set();

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

    checkBtn.disabled = false;
    checkBtn.onclick = () => {
        if (answered || selectedAnswers.size === 0) return;
        answered = true;
        const selectedArray = Array.from(selectedAnswers).sort();
        const correctArray = [...q.respuesta].sort();
        const isCorrect = JSON.stringify(selectedArray) === JSON.stringify(correctArray);

        options.forEach(btn => {
            const key = btn.dataset.key;
            const isSelected = selectedAnswers.has(key);
            const isCorrectOption = q.respuesta.includes(key);
            if (isCorrectOption) btn.classList.add("correct");
            else if (isSelected) btn.classList.add("wrong");
            btn.disabled = true;
        });

        feedback.innerHTML = isCorrect 
            ? "✅ <strong>¡Correcto!</strong>" 
            : "❌ <strong>Incorrecto</strong><br><small>Las respuestas correctas están marcadas en verde.</small>";
        feedback.className = isCorrect ? "correct" : "wrong";
        checkBtn.disabled = true;
    };
}

// ======================== CARGA DE DATOS ========================
fetch("data.json")
    .then(res => res.json())
    .then(data => {
        allFlashcards = [
            ...(data.reglamentacion || []).map(q => ({ ...q, categoria: "Reglamentación" })),
            ...(data.tecnica || []).map(q => ({ ...q, categoria: "Técnica" }))
        ];
        loadQuestions();
    });

// ======================== NAVEGACIÓN ========================
nextBtn.onclick = () => { currentIndex = (currentIndex + 1) % currentFlashcards.length; showCard(); };
prevBtn.onclick = () => { currentIndex = (currentIndex - 1 + currentFlashcards.length) % currentFlashcards.length; showCard(); };

// ======================== CAMBIO DE NIVEL ========================
document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentLevel = btn.dataset.level;
        loadQuestions();
    });
});

// ======================== CAMBIO DE CATEGORÍA (NUEVO) ========================
document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        loadQuestions();
    });
});