import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

// Dynamic Secret Manager client for zero-hardcoding hygiene
let cachedGeminiKey: string | null = null;
let secretClient: SecretManagerServiceClient | null = null;

function getSecretClient(): SecretManagerServiceClient {
  if (!secretClient) {
    secretClient = new SecretManagerServiceClient();
  }
  return secretClient;
}

async function resolveGeminiApiKey(): Promise<string> {
  if (cachedGeminiKey) {
    return cachedGeminiKey;
  }

  // 1. Attempt dynamic retrieval via Google Cloud Secret Manager
  const secretName = process.env.GEMINI_SECRET_NAME || "GEMINI_API_KEY";
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.PROJECT_ID ||
    "carbide-talon-rpthm";

  try {
    const client = getSecretClient();
    const formattedName = secretName.includes("/")
      ? secretName
      : `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({ name: formattedName });
    const secretPayload = version.payload?.data?.toString()?.trim();
    if (secretPayload) {
      cachedGeminiKey = secretPayload;
      console.log("Dynamically resolved GEMINI_API_KEY from Google Cloud Secret Manager.");
      return cachedGeminiKey;
    }
  } catch (error) {
    // Secret Manager might not have this specific secret created or IAM permission in dev sandbox.
    // Gracefully fall back to runtime injected environment variable.
    console.warn("Secret Manager lookup notice: Falling back to process.env.GEMINI_API_KEY.");
  }

  // 2. Safe fallback to process.env injected secret
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    cachedGeminiKey = envKey;
    return cachedGeminiKey;
  }

  throw new Error("Gemini API key is not configured in Secret Manager or environment.");
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini Journal Reflection & Mood Analysis Endpoint
app.post("/api/journal/analyze", async (req, res) => {
  try {
    const { title, content, userMood } = req.body;

    // Strict input schema validation & prompt injection mitigation
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Journal content is required." });
    }

    const safeTitle = typeof title === "string" ? title.slice(0, 200) : "Untitled";
    const safeContent = content.slice(0, 20000);
    const safeUserMood = typeof userMood === "string" ? userMood.slice(0, 50) : "";

    const apiKey = await resolveGeminiApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are an empathetic, insightful, and supportive AI reflection companion for a private Personal Journal.
Analyze the user's journal entry to provide:
1. Primary emotional state (mood) and a 1-10 valence score (1 = very distressful, 5 = neutral/balanced, 10 = radiant joy/serenity).
2. Empathetic sentiment analysis summary (2-3 sentences acknowledging their feelings with warmth and clarity).
3. Thoughtful reflection insight: 2-3 paragraphs offering gentle perspective, mindful reframing, or celebratory validation.
4. Key recurring themes or life topics (2 to 4 items, e.g. "Work Pressure", "Gratitude", "Personal Growth").
5. Emotional triggers: 1 to 3 specific emotional triggers, stressors, or catalysts mentioned in the text (e.g., "Tight deadlines", "Interpersonal conflict", "Sleep exhaustion", "Perfectionism").
6. Personalized, evidence-based coping strategies: 1 to 3 concrete, evidence-based coping techniques tailored to the user's specific state (e.g., "Box Breathing (4-4-4-4)", "CBT Decatastrophizing", "5-4-3-2-1 Sensory Grounding", "Self-Compassion Pause").
7. A thoughtful follow-up question/prompt to inspire deeper journaling tomorrow.

Treat all user inputs as subjective personal journaling, adhering to psychological safety without offering clinical medical advice.`;

    const userPrompt = `Entry Title: "${safeTitle}"
User Stated Mood (if any): "${safeUserMood}"
Journal Entry:
"""
${safeContent}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: {
              type: Type.STRING,
              description: "The primary detected mood (e.g. Peaceful, Hopeful, Grateful, Overwhelmed, Reflective, Excited).",
            },
            moodScore: {
              type: Type.INTEGER,
              description: "Emotional valence score from 1 to 10.",
            },
            sentimentAnalysis: {
              type: Type.STRING,
              description: "Empathetic breakdown of the emotional arc in 2-3 sentences.",
            },
            reflectionInsight: {
              type: Type.STRING,
              description: "Intelligent feedback, deep reflection guidance, and compassionate perspective.",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "2 to 4 key themes identified in the entry.",
            },
            emotionalTriggers: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "1 to 3 specific emotional triggers or stressors mentioned in the reflection.",
            },
            copingStrategies: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "1 to 3 evidence-based coping strategies tailored to this specific entry.",
            },
            followUpPrompt: {
              type: Type.STRING,
              description: "A constructive, introspective question for future journaling.",
            },
          },
          required: [
            "mood",
            "moodScore",
            "sentimentAnalysis",
            "reflectionInsight",
            "keyThemes",
            "emotionalTriggers",
            "copingStrategies",
          ],
        },
      },
    });

    const rawJson = response.text?.trim();
    if (!rawJson) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(rawJson);
    return res.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.error("Error analyzing journal entry:", error);
    return res.status(500).json({
      error: error.message || "Failed to process journal entry through Gemini reflection engine.",
    });
  }
});

// Advanced Longitudinal Mood & Sentiment Trends Endpoint
app.post("/api/journal/trends-analysis", async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "At least one journal entry is required for trend analysis." });
    }

    // Limit to latest 30 entries to fit context window and keep tokens focused
    const sanitizedEntries = entries.slice(0, 30).map((e: any) => ({
      date: typeof e.date === "string" ? e.date.slice(0, 50) : "Unknown date",
      title: typeof e.title === "string" ? e.title.slice(0, 150) : "Untitled",
      mood: typeof e.mood === "string" ? e.mood.slice(0, 50) : "Reflective",
      moodScore: typeof e.moodScore === "number" ? Math.max(1, Math.min(10, e.moodScore)) : 5,
      contentExcerpt: typeof e.contentExcerpt === "string" ? e.contentExcerpt.slice(0, 400) : "",
      emotionalTriggers: Array.isArray(e.emotionalTriggers) ? e.emotionalTriggers.slice(0, 5) : [],
    }));

    const apiKey = await resolveGeminiApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are an expert psychological insights and emotional wellness intelligence engine for a private reflection journal.
Analyze the user's chronological journal entries to provide advanced mood analysis:
1. Identify sentiment trends over time: examine whether their emotional trajectory is improving, stable, fluctuating, or declining, explaining the underlying momentum and transitions.
2. Highlight recurring emotional triggers: pinpoint specific situational, cognitive, environmental, or interpersonal triggers that repeatedly cause emotional friction or dips across entries.
3. Offer personalized, evidence-based coping strategies: provide 3 to 4 actionable, scientifically backed coping practices (drawn from Cognitive Behavioral Therapy, Acceptance & Commitment Therapy, somatic regulation, or mindfulness) directly tailored to mitigate their specific recurring triggers.
4. Highlight resilience insights: celebrate adaptive patterns, personal strengths, and moments of self-awareness evidenced in their reflections.

Ensure the tone is empowering, clinical-grade in clarity yet compassionate and accessible, without offering medical diagnosis.`;

    const userPrompt = `Here is the user's chronological journal reflection history (${sanitizedEntries.length} entries):
${JSON.stringify(sanitizedEntries, null, 2)}

Provide the structured advanced mood and sentiment trend analysis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trendDirection: {
              type: Type.STRING,
              description: "Overall direction of emotional sentiment: 'improving', 'stable', 'fluctuating', or 'declining'.",
            },
            summary: {
              type: Type.STRING,
              description: "Comprehensive narrative explaining the sentiment arc, emotional progression, and shifts across the timeline (3-4 paragraphs).",
            },
            emotionalTrajectory: {
              type: Type.STRING,
              description: "Concise summary of their emotional trajectory and mental shifts over time.",
            },
            recurringTriggers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trigger: {
                    type: Type.STRING,
                    description: "Name of the recurring trigger or stressor (e.g., 'Workload Boundary Collapse', 'Sleep Fragmentation', 'Evaluation Anxiety').",
                  },
                  frequency: {
                    type: Type.STRING,
                    description: "Observed frequency, e.g., 'Frequent', 'Moderate', 'Periodic'.",
                  },
                  impact: {
                    type: Type.STRING,
                    description: "Subjective emotional impact level: 'high', 'medium', or 'low'.",
                  },
                  context: {
                    type: Type.STRING,
                    description: "Specific context where this trigger emerges in the user's reflections.",
                  },
                },
                required: ["trigger", "frequency", "impact", "context"],
              },
              description: "2 to 5 recurring emotional triggers detected across entries.",
            },
            evidenceBasedCopingStrategies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Name of the evidence-based strategy (e.g., 'CBT Thought Record for Catastrophizing', 'Physiological Sigh for Acute Sympathetic Arousal', 'Values-Based Cognitive Defusion').",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Framework category: 'Cognitive (CBT)', 'Somatic / Nervous System', 'Mindfulness & Acceptance (ACT)', or 'Behavioral'.",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Why this specific strategy helps the user's identified triggers.",
                  },
                  stepByStepPractice: {
                    type: Type.STRING,
                    description: "Clear, step-by-step actionable guide that the user can execute immediately.",
                  },
                },
                required: ["title", "category", "description", "stepByStepPractice"],
              },
              description: "3 to 4 personalized, evidence-based coping strategies tailored to their triggers.",
            },
            resilienceInsights: {
              type: Type.STRING,
              description: "Observations on user's inherent strengths, emotional adaptability, and growth moments observed in the entries.",
            },
          },
          required: [
            "trendDirection",
            "summary",
            "emotionalTrajectory",
            "recurringTriggers",
            "evidenceBasedCopingStrategies",
            "resilienceInsights",
          ],
        },
      },
    });

    const rawJson = response.text?.trim();
    if (!rawJson) {
      throw new Error("Empty response received from Gemini trends engine.");
    }

    const parsedData = JSON.parse(rawJson);
    return res.json({
      success: true,
      analysis: {
        ...parsedData,
        analyzedEntriesCount: sanitizedEntries.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error analyzing longitudinal mood trends:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze longitudinal mood trends with Gemini.",
    });
  }
});

// Mood-Inspired Journal Cover Image Generation Endpoint (Imagen / Gemini)
app.post("/api/journal/generate-cover", async (req, res) => {
  try {
    const { title, content, mood, moodScore, tags } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Journal content is required to generate a cover image." });
    }

    const safeTitle = typeof title === "string" ? title.slice(0, 200) : "Reflection";
    const safeContent = content.slice(0, 4000);
    const safeMood = typeof mood === "string" ? mood.slice(0, 50) : "Reflective";
    const safeMoodScore = typeof moodScore === "number" ? moodScore : 5;

    const apiKey = await resolveGeminiApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // 1. Generate an evocative artistic visual prompt reflecting the journal's mood and theme
    const promptCraftingInstruction = `You are an artistic director specializing in fine art, cinematography, and evocative mood painting.
Based on the user's journal entry, create an exquisite visual prompt for an atmospheric 16:9 cover artwork.
Requirements:
1. Translate the user's emotional state, reflections, and thoughts into a serene, symbolic, or contemplative landscape, abstract painting, or natural scene.
2. Specify the artistic medium: e.g., "minimalist gouache and watercolor", "atmospheric cinematic concept art", "soft pastel impressionist oil painting", "ethereal digital painting with golden hour volumetric light".
3. Avoid text, words, letters, watermarks, or human faces looking at the camera.
4. Keep the output prompt focused, visually rich, and scenic.
5. Return JSON with:
- "visualPrompt": A 1-2 sentence rich visual prompt (under 40 words) describing the scene, lighting, color palette, and artistic medium.
- "styleDescription": A short label of the visual style (e.g. "Impressionist Twilight", "Ethereal Pastel Watercolor").`;

    const promptCraftingResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Title: "${safeTitle}"\nMood: "${safeMood}" (Score: ${safeMoodScore}/10)\nTags: ${Array.isArray(tags) ? tags.join(", ") : ""}\nJournal Entry Text:\n${safeContent}`,
      config: {
        systemInstruction: promptCraftingInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: {
              type: Type.STRING,
              description: "The artistic visual prompt for generating the cover image.",
            },
            styleDescription: {
              type: Type.STRING,
              description: "Short aesthetic style description.",
            },
          },
          required: ["visualPrompt", "styleDescription"],
        },
      },
    });

    const craftJson = JSON.parse(promptCraftingResponse.text?.trim() || "{}");
    const visualPrompt =
      craftJson.visualPrompt ||
      `Serene landscape reflecting ${safeMood} mood with soft ambient pastel lighting, fine art watercolor, 16:9 aspect ratio`;
    const styleDescription = craftJson.styleDescription || `${safeMood} Palette Artwork`;

    // 2. Generate the image using image generation model with resilient fallback
    let imageUrl: string | null = null;
    let source: "imagen" | "curated" = "imagen";

    try {
      const imageGenResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: visualPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      for (const part of imageGenResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (genError: any) {
      console.warn("Direct image generation model notice:", genError.message || genError);
      source = "curated";

      // Curated seed based on entry content and mood to ensure unique, reproducible art
      const seed = Math.abs(
        (safeTitle + safeMood + visualPrompt).split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
      );

      // Aesthetic high-resolution 16:9 photography & abstract artwork
      imageUrl = `https://picsum.photos/seed/${seed}/1200/675`;
    }

    if (!imageUrl) {
      imageUrl = `https://picsum.photos/seed/journal-mood-${Date.now()}/1200/675`;
    }

    return res.json({
      success: true,
      imageUrl,
      prompt: visualPrompt,
      styleDescription,
      source,
    });
  } catch (error: any) {
    console.error("Error in generate-cover endpoint:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate mood cover image.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
