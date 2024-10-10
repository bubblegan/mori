import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main(prompt: string) {
  const completion = await openai.chat.completions
    .create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o",
    })
    .catch(async (err) => {
      throw err;
    });

  return completion;
}

export default main;
