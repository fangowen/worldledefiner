let definitionDisplayed = false;

const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

function checkGameState(){
    const rawState = localStorage.getItem('nyt-wordle-state')

    if (!rawState) {
        return;
    }
    try{
        const state = JSON.parse(rawState);
        const gameStatus = state.status; // inprogress, win ,fail
        const solution = state.solution; 
    if ((gameStatus === 'WIN' || gameStatus === 'FAIL') && !definitionDisplayed) {
            definitionDisplayed = true; // Set flag to prevent repeats
            fetchDefinition(solution);
        }
    } catch (e) {
        console.log("Wordle Definer: Could not parse game state.");
    }
}
