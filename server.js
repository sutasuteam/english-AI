require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req,res)=>{
  res.send("English AI Server Running");
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const gemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await gemini.json();

    if(data.error){
        return res.status(500).json({
            reply: data.error.message
        });
    }
    
    const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from Gemini";

    await supabase.from("chat_messages").insert([
      { role: "user", message },
      { role: "ai", message: reply }
    ]);

    res.json({ reply });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      reply: "Server Error"
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
