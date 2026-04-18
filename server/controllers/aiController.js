const { GoogleGenerativeAI } = require("@google/generative-ai");

const explainSnippet = async (req, res, next) => {
    try {
        const { title, description, body, method, url, type, language } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Gemini API key is missing. Please add it to your .env file." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using 'gemini-flash-latest' which maps to the currently available 2.x flash models 
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let promptText = "";

        if (type === 'api_doc') {
            promptText = `You are an expert Technical Writer. Explain this REST API endpoint, its purpose, and what the expected JSON body represents in 2-3 bullet points. Be concise.
            
API Details:
Title: ${title}
Method: ${method}
Endpoint: ${url}
Description: ${description}
JSON Body: ${body || "None"}
`;
        } else if (type === 'code') {
            promptText = `You are a Senior Developer. Analyze this code and explain the algorithm or logic used in a way that is easy for a junior developer to understand. Be concise and write in a few bullet points.
            
Code Details:
Title: ${title}
Language: ${language}
Description: ${description}
Code:
\`\`\`${language}
${body}
\`\`\`
`;
        } else {
            return res.status(400).json({ message: "Invalid snippet type" });
        }

        const result = await model.generateContent(promptText);
        const responseText = result.response.text();

        return res.status(200).json({ explanation: responseText });
    } catch (error) {
        console.error("AI Explanation Error:", error);
        return res.status(500).json({ message: "Failed to generate explanation. Check API key and quota." });
    }
};

const generateTasks = async (req, res, next) => {
    try {
        const { goal } = req.body;

        if (!goal) {
            return res.status(400).json({ message: "Goal is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Gemini API key is missing. Please add it to your .env file." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-flash-latest since we confirmed it's supported by the API Key
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const promptText = `You are an expert Project Manager. Break down the following big goal into 3 to 5 actionable sub-tasks.
Return ONLY a valid raw JSON array of objects. Do not wrap it in markdown blocks (e.g. no \`\`\`json).
Each object must have exactly these keys:
- "title" (string, max 50 chars)
- "description" (string, brief explanation of the step)
- "priority" (string, must be one of: "High", "Medium", "Low")

Goal: ${goal}`;

        const result = await model.generateContent(promptText);
        let responseText = result.response.text().trim();

        // Sometimes Gemini returns markdown blocks despite instructions
        if (responseText.startsWith('```json')) {
            responseText = responseText.substring(7);
        }
        if (responseText.startsWith('```')) {
            responseText = responseText.substring(3);
        }
        if (responseText.endsWith('```')) {
            responseText = responseText.substring(0, responseText.length - 3);
        }
        responseText = responseText.trim();

        const tasks = JSON.parse(responseText);

        return res.status(200).json({ tasks });
    } catch (error) {
        console.error("AI Task Generation Error:", error);
        return res.status(500).json({ message: "Failed to generate tasks via AI. Please try again." });
    }
};

module.exports = { explainSnippet, generateTasks };
