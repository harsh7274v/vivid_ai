const fetch = require('node-fetch');

async function run() {
  const res = await fetch('http://localhost:3000/api/openrouter/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Hello, please write a 10 sentence story about a cat.',
      stream: true,
      model: 'google/gemma-3-4b-it:free'
    })
  });

  if (!res.ok) {
    console.log('Error', res.status, await res.text());
    return;
  }

  const reader = res.body;
  reader.on('data', chunk => {
    process.stdout.write(`CHUNK: ${chunk.toString()}`);
  });
  reader.on('end', () => {
    console.log('\nDONE');
  });
}
run();
