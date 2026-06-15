const key = process.env.VITE_OPENAI_API_KEY;
if (!key) {
  console.log("No key found");
  process.exit(1);
}

fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  },
  body: JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Say hello" }]
  })
}).then(res => res.json()).then(data => {
  console.log("Response:", JSON.stringify(data, null, 2));
}).catch(err => {
  console.error("Error:", err);
});
