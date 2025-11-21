const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;
        const user = req.user; // From auth middleware

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(503).json({ error: 'AI service not configured (API Key missing)' });
        }

        // 1. Build Context
        let systemInstruction = "";
        let contextData = "";

        if (user.role === 'student') {
            // Fetch student details
            const [students] = await db.promise().query('SELECT * FROM students WHERE user_id = ?', [user.id]);
            const student = students[0];

            if (student) {
                contextData = `
                    User Profile:
                    - Name: ${student.name}
                    - Branch: ${student.branch}
                    - CGPA: ${student.cgpa}
                    - Skills: ${student.skills || 'None listed'}
                `;
            }

            systemInstruction = `
                You are a helpful Placement Assistant for a university student.
                Your goal is to help them with job applications, resume tips, interview preparation, and navigating the placement system.
                
                ${contextData}

                - If they ask about eligible drives, ask for their preferences if not clear, or suggest based on their branch/skills.
                - Be encouraging and professional.
                - Keep responses concise and actionable.
            `;

        } else if (user.role === 'admin') {
            systemInstruction = `
                You are an Administrative Assistant for the Placement Cell.
                Your goal is to help placement officers manage drives, review applications, and analyze data.
                
                - You can suggest strategies to improve placement rates.
                - You can help draft emails or announcements.
                - Keep responses professional and data-driven.
            `;
        }

        // 2. Construct Chat History
        // Gemini SDK supports history. We'll reconstruct it.
        // history comes from frontend as [{role: 'user'|'model', parts: [{text: '...'}]}]

        const chat = model.startChat({
            history: history || [],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        });

        // 3. Send Message & Stream Response
        const result = await chat.sendMessageStream(message);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();

    } catch (error) {
        console.error('Chatbot Error:', error);
        // If headers sent, end response, else send json error
        if (res.headersSent) {
            res.end();
        } else {
            res.status(500).json({ error: 'Failed to process request' });
        }
    }
};
