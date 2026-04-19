// ======================== CONFIGURACIÓN ========================
let allFlashcards = [];
let currentFlashcards = [];
let currentIndex = 0;
let currentLevel = "novicio";
let currentCategory = "ambas";
let currentOrder = "aleatorio";
let correctCount = 0;
let incorrectCount = 0;

// DOM elements
const card = document.getElementById("card");
const front = card.querySelector(".front");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const checkBtn = document.getElementById("check-button");
prevBtn.disabled = true;
nextBtn.disabled = true;

// ======================== ALMACENAMIENTO LOCAL ========================
function saveProgress() {
    if (currentFlashcards.length === 0) {
        localStorage.removeItem('radioaficionado_progress');
        return;
    }
    const progress = {
        level: currentLevel,
        category: currentCategory,
        order: currentOrder,
        flashcards: currentFlashcards,
        index: currentIndex,
        correct: correctCount,
        incorrect: incorrectCount
    };
    localStorage.setItem('radioaficionado_progress', JSON.stringify(progress));
}

// ======================== MEZCLA ========================
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ======================== ACTUALIZAR ESTADÍSTICAS ========================
function updateStats() {
    document.getElementById("question-count").textContent = currentFlashcards.length;
    document.getElementById("correct-count").textContent = correctCount;
    document.getElementById("incorrect-count").textContent = incorrectCount;
}

// ======================== FILTRADO ========================
function loadQuestions() {
    let filtered = allFlashcards.filter(q => {
        if (!q || !q.numero) return false;
        const num = q.numero.trim();
        const isRoman = !num.startsWith("P");
        const isPB = num.startsWith("PB.");
        let matchesLevel = isRoman || isPB;
        if (currentLevel === "novicio") matchesLevel = matchesLevel || num.startsWith("PBN.");
        else if (currentLevel === "general") matchesLevel = matchesLevel || num.startsWith("PBG.");
        else if (currentLevel === "superior") matchesLevel = matchesLevel || num.startsWith("PBS.");

        let matchesCategory = true;
        if (currentCategory === "reglamentacion")
            matchesCategory = q.categoria === "Reglamentación";
        else if (currentCategory === "tecnica")
            matchesCategory = q.categoria === "Técnica";

        return matchesLevel && matchesCategory;
    });

    if (currentOrder === "aleatorio") {
        currentFlashcards = shuffle(filtered);
    } else {
        currentFlashcards = filtered;
    }

    currentFlashcards = currentFlashcards.map(q => ({
        ...q,
        answered: false,
        selected: null,
        isCorrect: null
    }));

    correctCount = 0;
    incorrectCount = 0;
    currentIndex = 0;
    updateStats();

    if (currentFlashcards.length === 0) {
        alert(`No hay preguntas disponibles para ${currentLevel.toUpperCase()} + ${currentCategory}`);
        return;
    }

    prevBtn.disabled = false;
    nextBtn.disabled = false;
    showCard();
    saveProgress();                    // ← Guarda la nueva sesión
}

// ======================== MOSTRAR PREGUNTA ========================
function showCard() {
    const q = currentFlashcards[currentIndex];
    if (!q) return;

    let optionsHTML = '';
    let feedbackHTML = '';
    const isAnswered = q.answered;

    if (isAnswered) {
        const selectedSet = new Set(q.selected || []);
        optionsHTML = Object.entries(q.opciones)
            .map(([key, val]) => {
                const isSelected = selectedSet.has(key);
                const isCorrectOption = q.respuesta.includes(key);
                let extraClass = '';
                if (isCorrectOption) extraClass = 'correct';
                else if (isSelected) extraClass = 'wrong';
                return `
                    <button class="option ${extraClass}" data-key="${key}" disabled>
                        <b>${key.toUpperCase()}</b>: ${val}
                    </button>
                `;
            }).join("");
        feedbackHTML = q.isCorrect
            ? `<p id="feedback" class="correct" style="margin-top:20px; font-size:1.3rem; text-align:center;">✅ <strong>¡Correcto!</strong></p>`
            : `<p id="feedback" class="wrong" style="margin-top:20px; font-size:1.3rem; text-align:center;">❌ <strong>Incorrecto</strong><br><small>Las respuestas correctas están marcadas en verde.</small></p>`;
    } else {
        optionsHTML = Object.entries(q.opciones)
            .map(([key, val]) => `
                <button class="option" data-key="${key}">
                    <b>${key.toUpperCase()}</b>: ${val}
                </button>
            `).join("");
        feedbackHTML = `<p id="feedback" style="margin-top:20px; font-size:1.3rem; text-align:center;"></p>`;
    }

    front.innerHTML = `
        <strong>${q.categoria} #${q.numero}</strong><br><br>
        <div style="font-size:1.1rem; line-height:1.4;">${q.pregunta}</div>
        <br>
        ${optionsHTML}
        ${feedbackHTML}
    `;

    if (isAnswered) {
        checkBtn.disabled = true;
        return;
    }

    const options = front.querySelectorAll(".option");
    const feedback = front.querySelector("#feedback");
    let selectedAnswers = new Set();

    options.forEach(btn => {
        btn.onclick = () => {
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
        if (selectedAnswers.size === 0) return;

        const selectedArray = Array.from(selectedAnswers).sort();
        const correctArray = [...q.respuesta].sort();
        const isCorrect = JSON.stringify(selectedArray) === JSON.stringify(correctArray);

        q.selected = selectedArray;
        q.isCorrect = isCorrect;
        q.answered = true;

        if (isCorrect) correctCount++;
        else incorrectCount++;

        updateStats();

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

        saveProgress();        // ← Guarda después de responder
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

        // === RECUPERAR PROGRESO GUARDADO ===
        const savedProgress = localStorage.getItem('radioaficionado_progress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);

                currentLevel = progress.level || "novicio";
                currentCategory = progress.category || "ambas";
                currentOrder = progress.order || "aleatorio";

                // Restaurar botones activos
                document.querySelectorAll(".level-btn").forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.level === currentLevel);
                });
                document.querySelectorAll(".category-btn").forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.category === currentCategory);
                });
                document.querySelectorAll(".order-btn").forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.order === currentOrder);
                });

                currentFlashcards = progress.flashcards || [];
                currentIndex = typeof progress.index === 'number' ? progress.index : 0;
                correctCount = progress.correct || 0;
                incorrectCount = progress.incorrect || 0;

                updateStats();

                if (currentFlashcards.length > 0) {
                    prevBtn.disabled = false;
                    nextBtn.disabled = false;
                    showCard();
                    return; // ya restauramos, no cargamos de nuevo
                }
            } catch (e) {
                console.error("Error al cargar progreso guardado:", e);
                localStorage.removeItem('radioaficionado_progress');
            }
        }

        // Si no hay progreso guardado o estaba vacío → cargar normal
        loadQuestions();
    });

// ======================== NAVEGACIÓN ========================
nextBtn.onclick = () => {
    currentIndex = (currentIndex + 1) % currentFlashcards.length;
    showCard();
    saveProgress();                    // ← Guarda al cambiar de pregunta
};

prevBtn.onclick = () => {
    currentIndex = (currentIndex - 1 + currentFlashcards.length) % currentFlashcards.length;
    showCard();
    saveProgress();                    // ← Guarda al cambiar de pregunta
};

// ======================== CAMBIO DE NIVEL / CATEGORÍA / ORDEN ========================
document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentLevel = btn.dataset.level;
        loadQuestions();
    });
});

document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        loadQuestions();
    });
});

document.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".order-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentOrder = btn.dataset.order;
        loadQuestions();
    });
});