import { askReligiousQuestion } from './src/services/geminiService.js';

async function test() {
  try {
    const res = await askReligiousQuestion("What is the meaning of life?");
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
