/**
 * Gemini Waste Classifier Test Script
 * Verifies defensive JSON parsing, category enforcement, confidence clamping,
 * and executes a test classification using an in-memory sample image buffer.
 * 
 * Run using: node server/scripts/testClassifier.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { parseAiResponse, classifyWaste, VALID_CATEGORIES } = require('../services/aiClassifier');

/**
 * Runs unit validations on the defensive AI JSON parser.
 */
const testParserUnitCases = () => {
  console.log('--- Testing Defensive AI Response Parser ---');

  // 1. Standard valid JSON
  const validJson = '{"category": "wet", "confidence": 0.95, "reason": "Banana peel and apple core detected."}';
  const res1 = parseAiResponse(validJson);
  if (res1.category !== 'wet' || res1.confidence !== 0.95) {
    throw new Error('Failed parsing standard valid JSON');
  }
  console.log('✓ Valid JSON parsed correctly');

  // 2. Markdown code fences ```json ... ```
  const markdownFenced = '```json\n{"category": "recyclable", "confidence": 0.88, "reason": "Clean plastic bottle."}\n```';
  const res2 = parseAiResponse(markdownFenced);
  if (res2.category !== 'recyclable' || res2.confidence !== 0.88) {
    throw new Error('Failed parsing Markdown-fenced JSON');
  }
  console.log('✓ Markdown code fenced response handled cleanly');

  // 3. Invalid category fallback to 'unknown'
  const invalidCategory = '{"category": "spaceship", "confidence": 0.99, "reason": "Not waste."}';
  const res3 = parseAiResponse(invalidCategory);
  if (res3.category !== 'unknown') {
    throw new Error('Failed invalid category fallback');
  }
  console.log('✓ Invalid category correctly defaulted to "unknown"');

  // 4. Out-of-bounds confidence clamping
  const highConfidence = '{"category": "dry", "confidence": 1.75, "reason": "Newspaper."}';
  const res4 = parseAiResponse(highConfidence);
  if (res4.confidence !== 1.0) {
    throw new Error('Failed upper confidence clamping');
  }
  console.log('✓ Upper confidence clamped to 1.0');

  // 5. Malformed non-JSON input
  const malformed = 'I think this is wet waste with 90% certainty';
  const res5 = parseAiResponse(malformed);
  if (res5.category !== 'unknown' || res5.confidence !== 0) {
    throw new Error('Failed malformed text fallback');
  }
  console.log('✓ Malformed text safely fell back to unknown');
};

/**
 * Runs an end-to-end test with a sample 1x1 PNG image buffer.
 */
const testLiveOrFallbackClassifier = async () => {
  console.log('\n--- Testing classifyWaste Execution ---');

  // 1x1 valid PNG buffer in base64
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sampleBuffer = Buffer.from(samplePngBase64, 'base64');

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
    console.log('GEMINI_API_KEY is not set. Verifying fallback handler...');
    const result = await classifyWaste(sampleBuffer, 'image/png');
    console.log('Fallback result:', result);
    if (result.category !== 'unknown' || typeof result.reason !== 'string') {
      throw new Error('Fallback classifier response failed');
    }
    console.log('✓ Fallback handler works properly when API key is missing');
  } else {
    console.log(`GEMINI_API_KEY detected. Sending test image to ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}...`);
    const result = await classifyWaste(sampleBuffer, 'image/png');
    console.log('Live Gemini Result:', result);
    if (!VALID_CATEGORIES.includes(result.category)) {
      throw new Error(`Unexpected category returned: ${result.category}`);
    }
    console.log('✓ Live Gemini vision API classified sample image successfully');
  }
};

const runTests = async () => {
  try {
    testParserUnitCases();
    await testLiveOrFallbackClassifier();
    console.log('\n======================================');
    console.log('ALL AI CLASSIFIER TESTS PASSED');
    console.log('======================================');
    process.exit(0);
  } catch (error) {
    console.error('\nClassifier test failed:', error.message);
    process.exit(1);
  }
};

runTests();
