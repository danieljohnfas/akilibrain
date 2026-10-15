import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TypeSafeClient, image, box, noul, choice, score } from '@typesafe-ai/sdk';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.TYPESAFE_API_KEY) {
  console.error('Error: TYPESAFE_API_KEY is not defined in .env.local');
  process.exit(1);
}

const client = new TypeSafeClient({
  apiKey: process.env.TYPESAFE_API_KEY.trim(),
  defaultHeaders: {
    // Required header for multimodal / image capabilities in Jev 1.14 Danger Zone
    'TypeSafe-Danger-Zone-Images': 'true'
  }
});

async function runTests() {
  console.log('=== Jev 1.14.0 Test Suite ===\n');

  // 1. Model Listing
  console.log('1. Checking Available Models...');
  const models = await client.models.list();
  console.log('Models found:', models.map(m => `${m.name} (${m.description})`).join(', '));
  console.log('\n----------------------------------------\n');

  // 2. Large Context & Multi-Question Evaluation
  console.log('2. Testing Long-Context Processing (>9k chars)...');
  const sampleState = 'Job Opportunity: Senior Full Stack Engineer. '.repeat(180) +
    '\nKey Requirements: React, TypeScript, Node.js, and PostgreSQL.\nDeadline: End of month.';

  const textRes = await client.systemOne({
    model: 'jev-preview',
    state: sampleState,
    questions: {
      category: choice('Categorize the opportunity', {
        engineering: 'Engineering and software roles',
        finance: 'Finance and accounting roles',
        operations: 'Operations and logistics roles'
      }),
      seniority: noul('Is this a senior or lead role?'),
      quality: score('Rate the clarity of this posting', ['Poor/Unclear', 'Basic', 'Good', 'Comprehensive'])
    }
  });

  console.log(`Resolved model: ${textRes.model}`);
  console.log('Category:', textRes.answers.category.choice, `(Confidence: ${textRes.answers.category.confidence})`);
  console.log('Senior role probability (noul):', textRes.answers.seniority.noul);
  console.log('Quality score:', textRes.answers.quality.score);
  console.log('Token usage:', textRes.usage);
  console.log('\n----------------------------------------\n');

  // 3. Multimodal Image & Bounding Box Primitive
  const sampleImgPath = path.join(process.cwd(), 'public', 'og.png');
  if (fs.existsSync(sampleImgPath)) {
    console.log('3. Testing Multimodal Image & Box primitive on public/og.png...');
    const buffer = fs.readFileSync(sampleImgPath);
    const imgAsset = image(new Blob([buffer], { type: 'image/png' }));

    const imgRes = await client.systemOne({
      model: 'jev-preview',
      state: imgAsset,
      questions: {
        hasText: noul('Does this image contain visible headline text?'),
        headlineBox: box('The main headline or logo region')
      }
    });

    console.log(`Resolved model: ${imgRes.model}`);
    console.log('Has visible text (noul):', imgRes.answers.hasText.noul);
    console.log('Detected box coordinates:', imgRes.answers.headlineBox.box);
    console.log('Box confidence:', imgRes.answers.headlineBox.confidence);
    console.log('Token usage:', imgRes.usage);
  } else {
    console.log('3. Skipped image test (public/og.png not found).');
  }

  console.log('\nAll tests completed successfully!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
