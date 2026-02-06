// content.js - V9 (Smart Dictionary)

console.log("✅ Wordle Definer V9: Smarter Definitions.");

let definitionDisplayed = false;
let isZombie = false;

// ... (Your existing checkGameStatus and zombie logic remains the same) ...
// Copying standard setup for context:
function safelySendMessage(message, callback) {
    if (isZombie) return;
    try {
        if (!chrome.runtime?.id) throw new Error("Context invalidated");
        chrome.runtime.sendMessage(message, callback);
    } catch (e) {
        isZombie = true; 
    }
}

function checkGameStatus() {
    if (isZombie || definitionDisplayed) return;

    let gameState = null;
    let winningWord = null;

    // A. Check Local Storage
    Object.keys(localStorage).forEach(key => {
        if (key.includes("wordle")) {
            try {
                const raw = JSON.parse(localStorage.getItem(key));
                const data = (raw.states && raw.states[0]) ? raw.states[0].data : (raw.boardState ? raw : null);
                if (data && data.status === "WIN") {
                    const guesses = data.boardState.filter(w => w);
                    winningWord = guesses[guesses.length - 1];
                }
            } catch (e) {}
        }
    });

    // B. Check Toast
    if (!winningWord) {
        const toasts = document.querySelectorAll('[class*="Toast-module_toast"]');
        for (const toast of toasts) {
            const text = toast.innerText || "";
            const match = text.match(/The word was\s+([A-Z]+)/i) || text.match(/^([A-Z]{5})$/);
            if (match && match[1]) winningWord = match[1];
        }
    }

    if (winningWord) {
        definitionDisplayed = true;
        fetchAndShow(winningWord);
    }
}

const observer = new MutationObserver(() => {
    if (!definitionDisplayed && !isZombie) checkGameStatus();
});
observer.observe(document.body, { childList: true, subtree: true });

// --- IMPROVED DEFINITION LOGIC ---

function fetchAndShow(word) {
    safelySendMessage({ action: "fetchDefinition", word: word }, (response) => {
        if (response && response.success) {
            createPopup(word, response.data);
        }
    });
}

function createPopup(word, data) {
    if (document.querySelector('.wd-container')) return;

    let def = "Definition not found.";
    let pos = "noun";

    // SMART SELECTION LOGIC
    if (Array.isArray(data) && data.length > 0) {
        // 1. Try to find the first common meaning (noun or verb)
        // We look for a definition longer than 15 chars to avoid "See X" or "Rent." type stubs
        let bestMeaning = null;
        let bestDef = null;

        // Loop through all dictionary entries
        for (const entry of data) {
            for (const meaning of entry.meanings) {
                for (const d of meaning.definitions) {
                    const text = d.definition;
                    // Prioritize definitions that are actual sentences (longer than 20 chars)
                    if (text.length > 20) {
                         bestMeaning = meaning;
                         bestDef = text;
                         break;
                    }
                }
                if (bestDef) break;
            }
            if (bestDef) break;
        }

        // Fallback: If no "long" definition found, just take the very first one
        if (!bestDef) {
            bestMeaning = data[0].meanings[0];
            bestDef = bestMeaning.definitions[0].definition;
        }

        pos = bestMeaning.partOfSpeech;
        def = bestDef;
    }

    const container = document.createElement('div');
    container.className = 'wd-container';
    container.innerHTML = `
        <div class="wd-header">
            <span class="wd-word">${word}</span>
            <span class="wd-pos">(${pos})</span>
            <button class="wd-close">&times;</button>
        </div>
        <p class="wd-def">${def}</p>
        <a href="https://www.google.com/search?q=define+${word}" target="_blank" class="wd-more">More info &rarr;</a>
    `;

    document.body.appendChild(container);
    container.querySelector('.wd-close').addEventListener('click', () => container.remove());
}

setInterval(checkGameStatus, 1000);