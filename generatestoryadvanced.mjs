#!/usr/bin/env node
//Same with generatestory.mjs, you DO NOT NEED THIS if you are NOT testing with CLI!
//Just adds both prompt+video

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET || "reel-output";

const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

const args = process.argv.slice(2);
const shouldGenerateVideo = args.includes("--generate-video");
const filteredArgs = args.filter((arg) => !arg.startsWith("--"));

if (filteredArgs.length < 4) {
  console.error(`
Usage: node generateStoryAdvanced.mjs <playerName> "<character>" "<action>" "<setting>" [--generate-video]

Examples:
  node generateStoryAdvanced.mjs Klee "An adventurer" "looking for treasure" "island with a volcano"
  node generateStoryAdvanced.mjs Klee "An adventurer" "looking for treasure" "island with a volcano" --generate-video
  `);
  process.exit(1);
}

const [playerName, character, action, setting] = filteredArgs;

console.log("Player:", playerName);
console.log("Character:", character);
console.log("Action:", action);
console.log("Setting:", setting);
console.log("Generate video:", shouldGenerateVideo ? "YES" : "NO (prompt only)");
console.log("─────────────────────────────────────");

async function generateWithNovaLite() {
  const systemPrompt = `You are a creative video prompt generator. Generate a concise, vivid video description (max 50 words) suitable for a 6-second video generation AI. Focus on visual elements, motion, and atmosphere. Be specific about camera angles, lighting, and action.`;
  const userPrompt = `Create a cinematic video prompt: ${character} ${action} in ${setting}. Make it visually dynamic and engaging.`;

  const payload = {
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    system: [{ text: systemPrompt }],
    inferenceConfig: { max_new_tokens: 200, temperature: 0.8 }
  };

  console.log("\nGenerating prompt with Nova Lite...\n");

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

  console.log("Saved to S3.\n");
}

async function generateVideo(prompt) {
  console.log("Starting Nova Reel video generation...\n");

  const startResp = await bedrockClient.send(
    new StartAsyncInvokeCommand({
      modelId: "amazon.nova-reel-v1:0",
      modelInput: {
        taskType: "TEXT_VIDEO",
        textToVideoParams: { text: prompt },
        videoGenerationConfig: {
          durationSeconds: 6,
          fps: 24,
          dimension: "1280x720",
          seed: Math.floor(Math.random() * 2147483647)
        }
      },
      outputDataConfig: {
        s3OutputDataConfig: { s3Uri: `s3://${OUTPUT_BUCKET}/${playerName}/` }
      }
    })
  );

  const invokeId = startResp?.invocationArn;
  if (!invokeId) throw new Error("Failed to get invocation ID");

  console.log(`Video job started: ${invokeId}\n`);
  console.log("Polling for completion (can take several minutes)...\n");

  let jobStatus = null;
  let jobResp = null;
  const maxPollMs = 15 * 60 * 1000;
  const startTime = Date.now();
  let pollCount = 0;

  while (true) {
    jobResp = await bedrockClient.send(new GetAsyncInvokeCommand({ invocationArn: invokeId }));
    jobStatus = jobResp?.status;
    pollCount++;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\rStatus: ${jobStatus} | Elapsed: ${elapsed}s | Polls: ${pollCount}`);

    if (["Completed", "Failed", "Expired", "Stopped"].includes(jobStatus)) {
      console.log("\n");
      break;
    }

    if (Date.now() - startTime > maxPollMs) {
      throw new Error("Timeout waiting for video generation");
    }

    await new Promise((r) => setTimeout(r, 10000));
  }

  if (jobStatus !== "Completed") {
    console.error("Video generation ended with status:", jobStatus);
    return false;
  }

  const outputS3 =
    jobResp.outputDataConfig?.s3OutputDataConfig?.s3Uri ||
    `s3://${OUTPUT_BUCKET}/${playerName}/`;

  console.log("Video generation completed!");
  console.log(`Output: ${outputS3}\n`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: OUTPUT_BUCKET,
      Key: `${playerName}/success.json`,
      Body: JSON.stringify({
        status: "Completed",
        outputS3,
        invokeId,
        timestamp: new Date().toISOString()
      }),
      ContentType: "application/json"
    })
  );

  return true;
}

(async () => {
  try {
    const generatedText = await generateWithNovaLite();
    await saveToS3(generatedText);

    if (shouldGenerateVideo) {
      await generateVideo(generatedText);
    } else {
      console.log("Prompt saved. Re-run with --generate-video to render the video.");
    }

    console.log(`Location: s3://${OUTPUT_BUCKET}/${playerName}/`);
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  }
})();