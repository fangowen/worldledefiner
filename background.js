// background.js 


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchDefinition") {
        
        // Dict.org Request
        const url = `https://dict.org/bin/Dict?Form=Dict1&Query=${request.word}&Strategy=*&Database=*`;
        
        fetch(url)
            .then(response => response.text())
            .then(html => sendResponse({ success: true, html: html }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Keep channel open for async response
    }
});