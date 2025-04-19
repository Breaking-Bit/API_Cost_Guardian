// Add a new method for Gemini proxy calls
const callGeminiAPI = async (prompt, model = 'gemini-pro') => {
    const response = await fetch('/api/proxy/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-project-id': getCurrentProject(),
            'x-gemini-key': getGeminiApiKey(),
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
            contents: [{ text: prompt }]
        })
    });
    return response.json();
};