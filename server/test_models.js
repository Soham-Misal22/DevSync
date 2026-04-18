const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // arbitrary, just to get client
        // Actually, to list models:
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        const fs = require('fs');
        if (data.models) {
            fs.writeFileSync('models.txt', data.models.map(m => `${m.name} - ${m.supportedGenerationMethods.join(", ")}`).join('\n'));
            console.log("Saved to models.txt");
        } else {
            fs.writeFileSync('models.txt', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error(err);
    }
}

listModels();
