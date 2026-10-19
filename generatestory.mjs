#!/usr/bin/env node
//You do not need this if you are not testing via CLI!

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET || "reel-output";

const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error(`
Usage: node generateStory.mjs <playerName> "<character>" "<action>" "<setting>"

Example:
  node generateStory.mjs Klee "An adventurer" "looking for treasure" "island with a volcano"
  `);
  process.exit(1);
}

const [playerName, character, action, setting] = args;

console.log("Player:", playerName);
console.log("Character:", character);
console.log("Action:", action);
console.log("Setting:", setting);
console.log("─────────────────────────────────────");

async function generateWithNovaLite() {
  const systemPrompt = `You are a creative video prompt generator. Generate a concise, vivid video description (max 50 words) suitable for a 6-second video generation AI. Focus on visual elements, motion, and atmosphere.`;
  const userPrompt = `Create a video prompt: ${character} ${action} in ${setting}. Make it cinematic and visually engaging.`;

  const payload = {
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    system: [{ text: systemPrompt }],
    inferenceConfig: { max_new_tokens: 200, temperature: 0.8 }
  };

  console.log("Generating prompt with Nova Lite...\n");

  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "us.amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const generatedText =
    responseBody.output?.message?.content?.[0]?.text ||
    responseBody.content?.[0]?.text ||
    responseBody.output?.text;

  if (!generatedText) {
    console.error("Response body:", JSON.stringify(responseBody, null, 2));
    throw new Error("Could not find generated text in response");
  }

  console.log("Generated Video Prompt:");
  console.log("─────────────────────────────────────");
  console.log(generatedText);
  console.log("─────────────────────────────────────\n");

  return generatedText;
}

async function saveToS3(generatedText) {
  const key = `${playerName}/novaLiteOutput.json`;
  console.log(`Saving to S3: s3://${OUTPUT_BUCKET}/${key}`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: OUTPUT_BUCKET,
      Key: key,
      Body: JSON.stringify(
        { playerName, character, action, setting, generatedText, timestamp: new Date().toISOString() },
        null,
        2
      ),
      ContentType: "application/json"
    })
  );

  console.log("Saved to S3.");
}

(async () => {
  try {
    const generatedText = await generateWithNovaLite();
    await saveToS3(generatedText);
    console.log("\nDone. This script only saves the prompt.");
    console.log("Use generateStoryAdvanced.mjs with --generate-video to render the video.");
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  }
})();