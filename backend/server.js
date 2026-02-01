//  import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// // import { GoogleGenerativeAI } from "@google/generative-ai";
//  dotenv.config();
//  const app = express();
//  app.use(cors());
//  app.use(express.json());

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// app.post("/api/generate-trip", async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ error: "Prompt is required" });
//     }

//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.0-flash",
//     });

//   /*  const prompt = "Name of most played sports worldwide"*/
//     const result = await model.generateContent(prompt);
// const text = result.response.text();

//     res.json({ result: result });
//   } catch (error) {
//     console.error("Gemini error:", error);
//     res.status(500).json({ error: "Failed to generate trip" });
//   }
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });
 import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import { GoogleGenerativeAI } from "@google/generative-ai";
 dotenv.config();
 const app = express();
 app.use(cors());
 app.use(express.json());

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/generate-trip", async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await groq.chat.completions.create({
     model: "llama-3.1-8b-instant",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

   res.json({
  result: completion?.choices?.[0]?.message?.content ?? "",
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate trip" });
  }
});

 const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});