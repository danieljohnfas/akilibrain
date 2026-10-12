import sitemap from '../src/app/sitemap';

async function main() {
  console.log('Testing Next.js 15 dynamic sitemap generation...');
  const entries = await sitemap();
  console.log(`Generated ${entries.length} sitemap URLs!`);
  console.log('Sample static entries:');
  entries.slice(0, 5).forEach(e => console.log(`  - ${e.url} (priority: ${e.priority}, freq: ${e.changeFrequency})`));
  console.log('Sample dynamic entries:');
  entries.slice(15, 20).forEach(e => console.log(`  - ${e.url} (priority: ${e.priority}, freq: ${e.changeFrequency})`));
}

main().catch(console.error);
