async function main() {
  const res = await fetch('https://akilihub-scraper.onrender.com/extract_text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      html: '<html><body><h1>Ministry of Finance Procurement</h1><p>Notice of Tender for Cloud Services 2026. <a href="https://example.com/docs/tender2026.pdf">Download Tender Document (PDF)</a></p></body></html>',
      include_tables: true,
      include_links: true,
      max_chars: 5000
    })
  });

  const data = await res.json();
  console.log('Scrapling extract_text response:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
