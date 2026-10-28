import { choice, score } from '@typesafe-ai/sdk';
import { systemOne } from './clef-client.mjs';

const hostsToTest = [
  'jobs.tz.cari.africa',
  'thecivilengineershub.blogspot.com',
  'tanzania.jobright.work',
  'nafasi.io',
  'boards.greenhouse.io',
  'sunking.pinpointhq.com',
  'jobs.lever.co'
];

async function main() {
  console.log('Testing host classification with Clef System One...');
  for (const host of hostsToTest) {
    try {
      const result = await systemOne({
        state: { domain: host },
        questions: {
          classification: choice("Is this domain an authentic direct employer/ATS or a third-party job aggregator/blog?", {
            "Direct_Employer_Or_ATS": null,
            "Third_Party_Aggregator_Or_Blog": null
          })
        }
      });
      console.log(`[Clef] ${host} => ${result.answers?.classification?.choice} (confidence: ${(result.answers?.classification?.confidence * 100).toFixed(1)}%)`);
    } catch (e) {
      console.error(`Error classifying ${host}:`, e.message);
    }
  }
}

main().catch(console.error);
