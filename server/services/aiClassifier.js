/**
 * Google Gemini Vision Waste Classifier Service
 * Uses the official @google/genai SDK to analyze photos of household waste,
 * categorize them into defined categories, and return strict validated JSON.
 */

const { GoogleGenAI } = require('@google/genai');

// Permitted waste categories
const VALID_CATEGORIES = ['wet', 'dry', 'recyclable', 'ewaste', 'hazardous', 'unknown'];

/**
 * Initializes Google Gen AI client with environment API key.
 * Returns null if no API key is provided.
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Defensively extracts and validates the JSON output returned by Gemini.
 * Protects against Markdown code blocks, malformed JSON, and unexpected categories.
 * 
 * @param {string} rawText - Raw text response from the Gemini model
 * @returns {{ category: string, confidence: number, reason: string }}
 */
const parseAiResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      category: 'unknown',
      confidence: 0,
      reason: 'Empty or invalid response from AI model',
    };
  }

  // Strip Markdown code fencing if present (e.g. ```json ... ```)
  let cleanText = rawText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleanText);

    // Validate category against permitted enum
    let category = (parsed.category || '').toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(category)) {
      category = 'unknown';
    }

    // Validate and clamp confidence between 0 and 1
    let confidence = parseFloat(parsed.confidence);
    if (isNaN(confidence)) {
      confidence = 0;
    } else {
      confidence = Math.max(0, Math.min(1, confidence));
    }

    // Ensure reason is a readable string
    const reason = typeof parsed.reason === 'string' && parsed.reason.trim().length > 0
      ? parsed.reason.trim()
      : 'No detailed reason provided by model';

    return {
      category,
      confidence,
      reason,
    };
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', rawText, parseError.message);
    return {
      category: 'unknown',
      confidence: 0,
      reason: 'AI output could not be parsed as valid JSON',
    };
  }
};

/**
 * Classifies household waste from an image buffer using Google Gemini Vision.
 * 
 * @param {Buffer} imageBuffer - In-memory image buffer
 * @param {string} mimeType - Image MIME type (e.g. 'image/jpeg', 'image/png')
 * @returns {Promise<{ category: string, confidence: number, reason: string }>}
 */
const classifyWaste = async (imageBuffer, mimeType = 'image/jpeg') => {
  const ai = getAiClient();

  // Graceful fallback if GEMINI_API_KEY is not set in development
  if (!ai) {
    console.warn('Warning: GEMINI_API_KEY is not set. Using fallback classification.');
    return {
      category: 'unknown',
      confidence: 0,
      reason: 'AI classification unavailable: GEMINI_API_KEY not configured.',
    };
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are an expert municipal waste segregation AI for the WasteWise citizen reward platform.
Analyze the provided photo of household waste and classify it into EXACTLY ONE of the following categories:
- "wet": organic waste, food leftovers, vegetable/fruit peels, tea leaves, garden leaves.
- "dry": clean paper, cardboard, textiles, dry non-recyclable household materials.
- "recyclable": clean plastic bottles, beverage cans, aluminum foil, glass bottles, clean tins.
- "ewaste": batteries, charger cables, electronics, circuit boards, discarded cell phones.
- "hazardous": medicines, syringes, sanitary waste, chemical containers, paint, pesticides, toxic materials.
- "unknown": unclear, non-waste item, selfie, empty room, or unidentifiable image.

Respond ONLY with a valid JSON object without extra formatting, using this exact schema:
{
  "category": "wet" | "dry" | "recyclable" | "ewaste" | "hazardous" | "unknown",
  "confidence": <number between 0.0 and 1.0>,
  "reason": "<short 1-2 sentence plain-language explanation of what items are seen and why this category was assigned>"
}`;

  try {
    const base64Data = imageBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawOutput = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) || '';
    return parseAiResponse(rawOutput);
  } catch (error) {
    console.error(`Gemini classification error: ${error.message}`);
    return {
      category: 'unknown',
      confidence: 0,
      reason: `AI classification error: ${error.message}`,
    };
  }
};

module.exports = {
  classifyWaste,
  parseAiResponse,
  VALID_CATEGORIES,
};
