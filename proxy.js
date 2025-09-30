const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Condensed EMS knowledge base (must fit within 8192 tokens)
const knowledgeBase = `
Soldering defects can often be reduced by ensuring proper temperature settings and cleaning flux residue. Common root causes of defects include incorrect component placement, poor solder quality, and inadequate cleaning. For soldering issues, start with simple checks like temperature and residue before advanced techniques like reflow profiling.`;

app.post("/api/chatgpt", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // Add input validation
    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "Invalid input message" });
    }

    // Construct the prompt with the knowledge base and user query
    const prompt = `Based on the following information, provide a concise, technical answer to the question: "${userMessage}". If the question involves solutions, prioritize simple solutions over complex ones. Keep it conversational and do not use asterisks, bolding, or any markdown formatting. Please provide plain text only.

Information:
${knowledgeBase}`;

    // Call Groq API
    const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
    const response = await axios.post(
      groqEndpoint,
      {
        messages: [
          {
            role: "system",
            content:
              "You are Malini (Machine AI and Line Intelligence and Notification IoT - Full Form), a helpful assistant with deep knowledge of Electronic Manufacturing Services processes. Answer concisely, stay on point, and avoid asterisks, bolding, or any markdown formatting. Return plain text only.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama3-70b-8192",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Clean the response to ensure no asterisks or markdown
    let generatedText = response.data.choices[0].message.content;
    generatedText = generatedText.replace(/\*\*/g, ""); // Remove bold asterisks
    generatedText = generatedText.replace(/\*/g, "");   // Remove single asterisks
    // Remove any other markdown-like characters that might cause issues
    generatedText = generatedText.replace(/[_`]/g, ""); // Remove underscores and backticks

    // Add error handling for empty responses
    if (!response.data?.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "Invalid API response format" });
    }

    res.json({ response: generatedText });
  } catch (error) {
    // Improved error logging and response
    console.error("API Error:", error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || "An internal server error occurred";
    res.status(statusCode).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/chatgpt", async (req, res) => {
  try {
    // Logic for handling GET requests to /api/ghjg
    res.json({ message: "Hello from /api/chatgpt" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

