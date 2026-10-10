const apiRoot = "https://us-central1-frontend-simplified.cloudfunctions.net";

export function validateField(value, field) {
  if (typeof value !== "string" || !value.trim()) return `Enter your ${field}.`;
  if (value.trim().length > 100) return `Keep your ${field} within 100 characters.`;
  if (!/\p{L}/u.test(value) || !/^[\p{L}\p{M} .,'’‘ʼ()\-]+$/u.test(value)) {
    return `Use letters, spaces, and punctuation for your ${field}; numbers and symbols are not accepted.`;
  }
  return "";
}

export function normalizeDemographics(data) {
  if (!data || typeof data !== "object") throw new Error("The service returned incomplete demographic results. Please try again.");
  const demographics = {};
  for (const category of ["race", "age", "gender"]) {
    const scores = data[category];
    if (!scores || typeof scores !== "object" || Array.isArray(scores) || !Object.keys(scores).length) {
      throw new Error("The service returned incomplete demographic results. Please try again.");
    }
    demographics[category] = Object.freeze(Object.entries(scores).map(([label, confidence]) => {
      if (!label.trim() || typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        throw new Error("The service returned invalid confidence scores. Please try again.");
      }
      return Object.freeze({ label, confidence });
    }).sort((a, b) => b.confidence - a.confidence));
  }
  return Object.freeze(demographics);
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
