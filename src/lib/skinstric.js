const apiRoot = "https://us-central1-frontend-simplified.cloudfunctions.net";

export function validateField(value, field) {
  if (typeof value !== "string" || !value.trim()) return `Enter your ${field}.`;
  if (value.trim().length > 100) return `Keep your ${field} within 100 characters.`;
  if (!/\p{L}/u.test(value) || !/^[\p{L}\p{M} .,'’‘ʼ()\-]+$/u.test(value)) {
    return `Use letters, spaces, and punctuation for your ${field}; numbers and symbols are not accepted.`;
  }
  return "";
}

export const estimateCategories = Object.freeze({
  concerns: {
    concern: ["acne", "dryness", "redness", "hyperpigmentation", "fine lines", "enlarged pores", "uneven texture"],
    severity: ["mild", "moderate", "severe"],
    area: ["forehead", "cheeks", "nose", "chin", "under eyes"],
  },
  skinType: {
    "skin type": ["normal", "dry", "oily", "combination", "sensitive"],
    hydration: ["low", "balanced", "high"],
    sensitivity: ["low", "moderate", "high"],
  },
  weather: {
    conditions: ["sunny", "partly cloudy", "overcast", "rainy", "snowy"],
    temperature: ["cold", "cool", "mild", "warm", "hot"],
    humidity: ["dry", "moderate", "humid"],
  },
});

export function normalizeScores(data, categories) {
  if (!data || typeof data !== "object") throw new Error("The service returned incomplete results. Please try again.");
  const results = {};
  for (const category of categories) {
    const scores = data[category];
    if (!scores || typeof scores !== "object" || Array.isArray(scores) || !Object.keys(scores).length) {
      throw new Error("The service returned incomplete results. Please try again.");
    }
    results[category] = Object.freeze(Object.entries(scores).map(([label, confidence]) => {
      if (!label.trim() || typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        throw new Error("The service returned invalid confidence scores. Please try again.");
      }
      return Object.freeze({ label, confidence });
    }).sort((a, b) => b.confidence - a.confidence));
  }
  return Object.freeze(results);
}

export function normalizeDemographics(data) {
  return normalizeScores(data, ["race", "age", "gender"]);
}

// Phase Two only returns race, age, and gender, so the other analysis modules use
// randomized scores in the same shape, generated when Phase Two succeeds.
export function simulateEstimates(random = Math.random) {
  const estimates = {};
  for (const [module, categories] of Object.entries(estimateCategories)) {
    const data = {};
    for (const [category, labels] of Object.entries(categories)) {
      const weights = labels.map(() => random() ** 3);
      const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
      data[category] = Object.fromEntries(labels.map((label, index) => [label, weights[index] / total]));
    }
    estimates[module] = normalizeScores(data, Object.keys(categories));
  }
  return Object.freeze(estimates);
}

export function formatConfidence(confidence) {
  return `${(confidence * 100).toFixed(2)}%`;
}

async function post(endpoint, body, signal) {
  let response;
  try {
    response = await fetch(`${apiRoot}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === "TimeoutError") throw new Error("The request timed out. Please try again.");
    throw new Error("Unable to reach Skinstric. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(`Skinstric is unavailable (${response.status}). Please try again.`);
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The service returned an unreadable response. Please try again.");
  }
  if (!result || result.success !== true) throw new Error("Skinstric could not process your request. Please try again.");
  return result;
}

export async function submitProfile(profile, signal) {
  for (const field of ["name", "location"]) {
    const error = validateField(profile[field], field);
    if (error) throw new Error(error);
  }
  await post("skinstricPhaseOne", profile, signal);
}

export async function analyzeImage(dataUrl, signal) {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("Choose a valid image before starting analysis.");
  const result = await post("skinstricPhaseTwo", { image: match[1] }, signal);
  return normalizeDemographics(result.data);
}
