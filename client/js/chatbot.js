// Chatbot Logic
document.addEventListener('DOMContentLoaded', () => {
    // Only init if logged in
    if (!Auth.getToken()) return;

    // Inject HTML
    const chatbotHTML = `
        <button class="chatbot-toggler">
            <span class="material-symbols-rounded">chat</span>
            <span class="material-symbols-rounded">close</span>
        </button>
        <div class="chatbot">
            <header>
                <h2>AI Assistant</h2>
                <span class="close-btn material-symbols-rounded">close</span>
            </header>
            <ul class="chatbox">
                <li class="chat incoming">
                    <span class="material-symbols-rounded">smart_toy</span>
                    <p>Hi there 👋<br>How can I help you today?</p>
                </li>
            </ul>
            <div class="chat-input">
                <textarea placeholder="Enter a message..." spellcheck="false" required></textarea>
                <span id="send-btn" class="material-symbols-rounded">send</span>
            </div>
        </div>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,0,0" />
    `;

    const div = document.createElement('div');
    div.innerHTML = chatbotHTML;
    document.body.appendChild(div);

    const chatbotToggler = document.querySelector(".chatbot-toggler");
    const closeBtn = document.querySelector(".close-btn");
    const chatbox = document.querySelector(".chatbox");
    const chatInput = document.querySelector(".chat-input textarea");
    const sendChatBtn = document.querySelector(".chat-input span");

    let userMessage = null;
    const inputInitHeight = chatInput.scrollHeight;
    let chatHistory = []; // Store history for context

    const createChatLi = (message, className) => {
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", `${className}`);
        let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-rounded">smart_toy</span><p></p>`;
        chatLi.innerHTML = chatContent;
        chatLi.querySelector("p").textContent = message;
        return chatLi;
    }

    const generateResponse = async (chatElement) => {
        const API_URL = `${CONFIG.API_URL}/chatbot/query`;
        const messageElement = chatElement.querySelector("p");

        // Add user message to history
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory.slice(-10) // Send last 10 messages for context
                })
            });

            if (!response.ok) throw new Error("API Error");

            // Handle Streaming Response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            messageElement.textContent = ""; // Clear "Thinking..."

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                messageElement.textContent = fullText;
                chatbox.scrollTo(0, chatbox.scrollHeight);
            }

            // Add model response to history
            chatHistory.push({ role: "model", parts: [{ text: fullText }] });

        } catch (error) {
            messageElement.classList.add("error");
            messageElement.textContent = "Oops! Something went wrong. Please try again.";
        } finally {
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }
    }

    const handleChat = () => {
        userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Clear input
        chatInput.value = "";
        chatInput.style.height = `${inputInitHeight}px`;

        // Append User Message
        chatbox.appendChild(createChatLi(userMessage, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Append "Thinking..." Message
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        generateResponse(incomingChatLi);
    }

    chatInput.addEventListener("input", () => {
        chatInput.style.height = `${inputInitHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
            e.preventDefault();
            handleChat();
        }
    });

    sendChatBtn.addEventListener("click", handleChat);
    closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
    chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
});
