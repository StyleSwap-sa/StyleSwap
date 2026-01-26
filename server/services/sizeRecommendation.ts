import { invokeLLM } from "../_core/llm";

/**
 * Body measurement data extracted from image analysis
 */
export interface BodyMeasurements {
  shoulderWidth: number; // cm
  chestWidth: number; // cm
  waistWidth: number; // cm
  hipWidth: number; // cm
  height?: number; // cm (optional)
}

/**
 * Size recommendation result
 */
export interface SizeRecommendation {
  recommendedSize: number;
  confidence: number; // 0-100
  explanation: string;
  alternativeSizes?: number[];
  measurements: BodyMeasurements;
}

/**
 * Standard size chart mapping measurements to sizes
 */
const STANDARD_SIZE_CHART: Record<number, BodyMeasurements> = {
  24: { shoulderWidth: 32, chestWidth: 28, waistWidth: 20, hipWidth: 28 },
  26: { shoulderWidth: 33, chestWidth: 30, waistWidth: 22, hipWidth: 30 },
  28: { shoulderWidth: 34, chestWidth: 32, waistWidth: 24, hipWidth: 32 },
  30: { shoulderWidth: 35, chestWidth: 34, waistWidth: 26, hipWidth: 34 },
  32: { shoulderWidth: 36, chestWidth: 36, waistWidth: 28, hipWidth: 36 },
  34: { shoulderWidth: 37, chestWidth: 38, waistWidth: 30, hipWidth: 38 },
  36: { shoulderWidth: 38, chestWidth: 40, waistWidth: 32, hipWidth: 40 },
  38: { shoulderWidth: 39, chestWidth: 42, waistWidth: 34, hipWidth: 42 },
  40: { shoulderWidth: 40, chestWidth: 44, waistWidth: 36, hipWidth: 44 },
  42: { shoulderWidth: 41, chestWidth: 46, waistWidth: 38, hipWidth: 46 },
  44: { shoulderWidth: 42, chestWidth: 48, waistWidth: 40, hipWidth: 48 },
  46: { shoulderWidth: 43, chestWidth: 50, waistWidth: 42, hipWidth: 50 },
  48: { shoulderWidth: 44, chestWidth: 52, waistWidth: 44, hipWidth: 52 },
  50: { shoulderWidth: 45, chestWidth: 54, waistWidth: 46, hipWidth: 54 },
};

/**
 * Calculate Euclidean distance between two measurement sets
 */
function calculateMeasurementDistance(
  measurements: BodyMeasurements,
  chartMeasurements: BodyMeasurements
): number {
  const shoulderDiff = measurements.shoulderWidth - chartMeasurements.shoulderWidth;
  const chestDiff = measurements.chestWidth - chartMeasurements.chestWidth;
  const waistDiff = measurements.waistWidth - chartMeasurements.waistWidth;
  const hipDiff = measurements.hipWidth - chartMeasurements.hipWidth;

  return Math.sqrt(
    shoulderDiff * shoulderDiff +
    chestDiff * chestDiff +
    waistDiff * waistDiff +
    hipDiff * hipDiff
  );
}

/**
 * Find closest size based on measurements
 */
function findClosestSize(measurements: BodyMeasurements): {
  size: number;
  distance: number;
  alternatives: number[];
} {
  const sizes = Object.keys(STANDARD_SIZE_CHART)
    .map(Number)
    .sort((a, b) => a - b);

  let closestSize = sizes[0];
  let minDistance = Infinity;
  const distances: Array<{ size: number; distance: number }> = [];

  for (const size of sizes) {
    const chartMeasurements = STANDARD_SIZE_CHART[size];
    const distance = calculateMeasurementDistance(measurements, chartMeasurements);
    distances.push({ size, distance });

    if (distance < minDistance) {
      minDistance = distance;
      closestSize = size;
    }
  }

  // Get alternative sizes (within 5cm distance)
  const alternatives = distances
    .filter(d => d.distance <= minDistance + 5 && d.size !== closestSize)
    .map(d => d.size)
    .slice(0, 2);

  return { size: closestSize, distance: minDistance, alternatives };
}

/**
 * Calculate confidence score based on measurement precision
 */
function calculateConfidence(distance: number): number {
  // Convert distance to confidence (0-100)
  // Lower distance = higher confidence
  // Max distance is ~20cm, which gives 0% confidence
  const maxDistance = 20;
  const confidence = Math.max(0, 100 - (distance / maxDistance) * 100);
  return Math.round(confidence);
}

/**
 * Get size recommendation using LLM
 */
export async function recommendSize(
  measurements: BodyMeasurements,
  clothingType: "upper" | "lower" | "combo" = "combo"
): Promise<SizeRecommendation> {
  // Find closest size based on measurements
  const { size: recommendedSize, distance, alternatives } = findClosestSize(measurements);
  const confidence = calculateConfidence(distance);

  // Use LLM to generate explanation
  const prompt = `You are a fashion sizing expert. Based on these body measurements, provide a brief, friendly explanation of why this size is recommended.

Body Measurements (in cm):
- Shoulder width: ${measurements.shoulderWidth}
- Chest width: ${measurements.chestWidth}
- Waist width: ${measurements.waistWidth}
- Hip width: ${measurements.hipWidth}
${measurements.height ? `- Height: ${measurements.height}` : ""}

Recommended Size: ${recommendedSize}
Confidence: ${confidence}%
Clothing Type: ${clothingType}

Provide a brief, friendly explanation (1-2 sentences) of why this size is recommended. Be specific about the measurements.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful fashion sizing assistant. Provide brief, friendly sizing recommendations based on body measurements.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const explanation =
      typeof content === "string"
        ? content
        : `Based on your measurements, size ${recommendedSize} should provide the best fit.`;

    return {
      recommendedSize,
      confidence,
      explanation,
      alternativeSizes: alternatives,
      measurements,
    };
  } catch (error) {
    // Fallback explanation if LLM fails
    const explanation = `Based on your measurements, size ${recommendedSize} is recommended. Your measurements suggest a ${
      confidence > 70 ? "good" : "reasonable"
    } fit for this size.`;

    return {
      recommendedSize,
      confidence,
      explanation,
      alternativeSizes: alternatives,
      measurements,
    };
  }
}

/**
 * Analyze body photo and extract measurements
 * This is a simplified implementation that uses LLM to analyze the image
 */
export async function analyzeBodyPhoto(imageUrl: string): Promise<BodyMeasurements | null> {
  try {
    // Use LLM with vision to analyze body proportions
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing body proportions from photos. Analyze the image and estimate body measurements in centimeters based on typical human proportions. Assume average height if not visible.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this body photo and provide estimated measurements in JSON format: {shoulderWidth, chestWidth, waistWidth, hipWidth, height}. Use centimeters. Be conservative in estimates.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "body_measurements",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shoulderWidth: {
                type: "number",
                description: "Shoulder width in centimeters",
              },
              chestWidth: {
                type: "number",
                description: "Chest width in centimeters",
              },
              waistWidth: {
                type: "number",
                description: "Waist width in centimeters",
              },
              hipWidth: {
                type: "number",
                description: "Hip width in centimeters",
              },
              height: {
                type: "number",
                description: "Estimated height in centimeters",
              },
            },
            required: ["shoulderWidth", "chestWidth", "waistWidth", "hipWidth"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const measurements = JSON.parse(contentStr);
    return {
      shoulderWidth: measurements.shoulderWidth,
      chestWidth: measurements.chestWidth,
      waistWidth: measurements.waistWidth,
      hipWidth: measurements.hipWidth,
      height: measurements.height,
    };
  } catch (error) {
    console.error("Error analyzing body photo:", error);
    return null;
  }
}

/**
 * Get all available sizes
 */
export function getAvailableSizes(): number[] {
  return Object.keys(STANDARD_SIZE_CHART)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Get size chart for reference
 */
export function getSizeChart(): Record<number, BodyMeasurements> {
  return STANDARD_SIZE_CHART;
}
