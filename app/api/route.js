import { NextResponse } from 'next/server';
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

function sanitizeText(text) {
  const replacements = {
    'butcher': 'mysterious figure',
    'maze': 'winding passage',
    'trap': 'discovery',
    'trapped': 'exploring',
    'descent': 'journey deeper',
    'blood': 'shadows',
    'cleaver': 'mysterious artifact',
    'death': 'mystery',
    'kill': 'encounter',
    'murder': 'encounter',
    'corpse': 'silhouette',
    'body': 'figure',
    'weapon': 'object',
    'knife': 'item',
    'cemetery': 'misty grounds',
    'grave': 'stone marker',
    'hospital': 'abandoned building',
    'gurney': 'wheeled cart',
    'crypt': 'stone chamber',
    'torture': 'mystery',
    'gore': 'shadows',
    'wound': 'mark',
    'injury': 'condition',
    'harm': 'effect'
  };

  let safe = text;
  Object.keys(replacements).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    safe = safe.replace(regex, replacements[word]);
  });

  return safe;
}

function containsUnsafeContent(text) {
  const bannedWords = [
    'blood', 'gore', 'weapon', 'knife', 'cleaver', 'death', 'kill',
    'murder', 'corpse', 'wound', 'stab', 'cut', 'harm', 'torture',
    'mutilate', 'dismember', 'decapitate', 'slaughter', 'butcher'
  ];

  // Whole-word match (with common suffixes) so "execute" or "harmony" don't trigger
  return bannedWords.some((word) =>
    new RegExp(`\\b${word}(s|es|ed|ing)?\\b`, 'i').test(text)
  );
}

function getFallbackPrompt() {
  return `Wide shot: A mysterious figure moves through a foggy, atmospheric environment. Shadows dance across aged surfaces as dim light flickers. Camera slowly tracks forward through swirling mist. Eerie whispers echo softly. Suspenseful, cinematic mood with dramatic lighting and mysterious ambiance.`;
}

async function generateWithNovaLite(character, action, setting, fullPrompt) {
  let finalPrompt;

  if (fullPrompt) {
    finalPrompt = sanitizeText(fullPrompt);
  } else {
    const safeCharacter = sanitizeText(character);
    const safeAction = sanitizeText(action);
    const safeSetting = sanitizeText(setting);
    finalPrompt = `Atmospheric scene: ${safeCharacter} ${safeAction} in ${safeSetting}. Focus on eerie mood, fog, shadows, and mystery.`;
  }

  const systemPrompt = `You are a cinematic video prompt generator specializing in atmospheric content.

STRICT RULES - Your response must NEVER contain these words or concepts:
- blood, gore, wounds, injuries, harm, death, corpses, bodies
- weapons, knives, cleavers, tools of violence
- physical violence, attacks, fighting, killing, murder
- explicit horror imagery, graphic content, torture
- butcher, slaughter, dismember, mutilate

REQUIRED ELEMENTS - Always include:
- Atmospheric mood (eerie, mysterious, suspenseful, ominous)
- Lighting descriptions (dim, flickering, shadowy, moonlit)
- Camera movement (slow push, tracking, dolly, crane)
- Environmental details (fog, mist, darkness, wind)
- Silhouettes and obscured figures
- Ambient sounds (whispers, creaking, rustling, echoes)
- Supernatural elements (glowing eyes, floating objects, distortions)

Generate exactly 40-50 words describing a 6-second cinematic shot. Focus ONLY on visual atmosphere, camera work, and environmental mood. Be cinematic and atmospheric, not violent.`;

  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            text: `Create a safe, atmospheric horror video prompt based on this: ${finalPrompt}

Requirements:
- Focus on mood, lighting, camera movement
- Include fog, shadows, mysterious atmosphere
- NO violence, gore, weapons, or explicit content
- Cinematic and visual descriptions only
- 40-50 words maximum`
          }
        ]
      }
    ],
    system: [{ text: systemPrompt }],
    inferenceConfig: {
      max_new_tokens: 150,
      temperature: 0.6
    }
  };

  try {
    const command = new InvokeModelCommand({
      modelId: "us.amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    let generatedText =
      responseBody.output?.message?.content?.[0]?.text ||
      responseBody.content?.[0]?.text ||
      responseBody.output?.text;

    if (!generatedText) {
      throw new Error("Could not find generated text in response");
    }

    generatedText = sanitizeText(generatedText);

    if (containsUnsafeContent(generatedText)) {
      console.warn("Generated prompt contained unsafe content, using fallback");
      generatedText = getFallbackPrompt();
    }

    return generatedText;
  } catch (error) {
    console.error("Error calling Nova Lite:", error);
    return getFallbackPrompt();
  }
}

async function generateVideoFile(playerName, prompt) {
  const safePrompt = sanitizeText(prompt);
  prompt = containsUnsafeContent(safePrompt) ? getFallbackPrompt() : safePrompt;

  const inputData = {
    taskType: "TEXT_VIDEO",
    textToVideoParams: { text: prompt },
    videoGenerationConfig: {
      durationSeconds: 6,
      fps: 24,
      dimension: "1280x720",
      seed: Math.floor(Math.random() * 2147483647)
    }
  };

  try {
    const startResp = await bedrockClient.send(
      new StartAsyncInvokeCommand({
        modelId: "amazon.nova-reel-v1:0",
        modelInput: inputData,
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: `s3://${OUTPUT_BUCKET}/${playerName}/`
          }
        }
      })
    );

    const invokeId = startResp?.invocationArn;
    if (!invokeId) throw new Error("Failed to get invocation ID");

    console.log("Video generation started:", invokeId);

    const maxPollMs = 15 * 60 * 1000;
    const startTime = Date.now();

    while (true) {
      const jobResp = await bedrockClient.send(
        new GetAsyncInvokeCommand({ invocationArn: invokeId })
      );
      const jobStatus = jobResp?.status;
      console.log(`Video generation status: ${jobStatus}`);

      if (["Completed", "Failed", "Expired", "Stopped"].includes(jobStatus)) {
        if (jobStatus === "Completed") {
          return `s3://${OUTPUT_BUCKET}/${playerName}/output.mp4`;
        }
        throw new Error(`Video generation failed with status: ${jobStatus}`);
      }

      if (Date.now() - startTime > maxPollMs) {
        throw new Error("Timeout waiting for video generation");
      }

      await new Promise((r) => setTimeout(r, 10000));
    }
  } catch (error) {
    console.error("Error during video generation:", error);
    throw new Error("Failed to generate video: " + error.message);
  }
}

async function saveToS3(playerName, data) {
  const outputData = {
    playerName: data.playerName,
    character: data.character,
    action: data.action,
    setting: data.setting,
    generatedText: data.prompt,
    timestamp: new Date().toISOString()
  };

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: OUTPUT_BUCKET,
        Key: `${playerName}/novaLiteOutput.json`,
        Body: JSON.stringify(outputData, null, 2),
        ContentType: "application/json"
      })
    );
  } catch (error) {
    console.error("Error saving to S3:", error);
    throw new Error("Failed to save to S3: " + error.message);
  }
}

export async function POST(request) {
  try {
    const { playerName, character, action, setting, fullPrompt, generateVideo } =
      await request.json();

    if (!playerName || !character || !action || !setting) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = await generateWithNovaLite(character, action, setting, fullPrompt);

    await saveToS3(playerName, { playerName, character, action, setting, prompt });

    let videoUrl = null;
    if (generateVideo) {
      videoUrl = await generateVideoFile(playerName, prompt);
    }

    return NextResponse.json({
      success: true,
      prompt,
      videoUrl: videoUrl || `s3://${OUTPUT_BUCKET}/${playerName}/output.mp4`,
      s3Path: `s3://${OUTPUT_BUCKET}/${playerName}/`
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}