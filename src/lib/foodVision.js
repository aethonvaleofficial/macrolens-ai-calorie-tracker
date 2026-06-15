import { foodVisionModel } from "./firebase";

function cleanJsonResponse(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

export async function analyzeFoodPhotoWithAI(photo) {
  if (!photo?.base64 || !photo?.mimeType) {
    throw new Error("Missing food photo data.");
  }

  const prompt = `
Analyze this food image for a calorie tracking app.

Return ONLY valid JSON in this exact format:

{
  "meal": "food name or meal name",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "confidence": 0,
  "notes": "short uncertainty note",
  "baseQuantity": 100
}

Rules:
- Estimate only visible food.
- Use realistic Indian/common food nutrition estimates.
- If portion is unclear, assume one normal serving.
- Confidence must be a number from 50 to 95.
- Calories must be kcal.
- Protein, carbs, and fat must be grams.
- Do not add markdown.
- Do not explain outside JSON.
`;

  const result = await foodVisionModel.generateContent([
    {
      inlineData: {
        data: photo.base64,
        mimeType: photo.mimeType,
      },
    },
    { text: prompt },
  ]);

  const text = result.response.text();
  const cleaned = cleanJsonResponse(text);
  const parsed = JSON.parse(cleaned);

  return {
    meal: String(parsed.meal || "Estimated meal"),
    calories: safeNumber(parsed.calories),
    protein: safeNumber(parsed.protein),
    carbs: safeNumber(parsed.carbs),
    fat: safeNumber(parsed.fat),
    confidence: Math.min(Math.max(safeNumber(parsed.confidence, 70), 50), 95),
    notes: String(parsed.notes || "AI estimate. Review before saving."),
    baseQuantity: safeNumber(parsed.baseQuantity, 100),
  };
}