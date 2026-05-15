async function run() {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite-preview-02-05:free',
      messages: [{ role: 'user', content: 'Say hello' }],
      stream: true
    })
  });
  
  if (!res.ok) { console.error('Error', await res.text()); return; }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(`CHUNK: ${decoder.decode(value)}`);
  }
}
run();
