import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateCategories, formatConfidence, normalizeDemographics, simulateEstimates, validateField } from "../src/lib/skinstric.js";

test("validation accepts international names, mononyms, and punctuation", () => {
  for (const name of ["李", "Élodie D’Arcy", "Jean-Luc", "O'Neill", "Jose\u0301", "Prince"]) {
    assert.equal(validateField(name, "name"), "");
  }
  for (const location of ["São Paulo", "St. John’s", "Winston-Salem", "東京都", "Paris, France"]) {
    assert.equal(validateField(location, "location"), "");
  }
});

test("validation rejects missing, numeric, malformed, and oversized values", () => {
  for (const value of [null, 42, "", "  ", "---", "John2", "Area ５", "Jane@Doe", "A\nB", "x".repeat(101)]) {
    assert.notEqual(validateField(value, "name"), "");
    assert.notEqual(validateField(value, "location"), "");
  }
});

test("normalization sorts every category and preserves the original response", () => {
  const data = { race: { white: 0.1, black: 0.8, "south asian": 0.1 }, age: { "20-29": 0.3, "30-39": 0.7 }, gender: { male: 0.4, female: 0.6 } };
  const original = structuredClone(data);
  const normalized = normalizeDemographics(data);
  assert.deepEqual(normalized.race.map((score) => score.label), ["black", "white", "south asian"]);
  assert.equal(normalized.age[0].label, "30-39");
  assert.equal(normalized.gender[0].label, "female");
  assert.deepEqual(data, original);
  assert.throws(() => { normalized.race[0].confidence = 0; }, TypeError);
  assert.throws(() => { normalized.gender.push({ label: "test", confidence: 1 }); }, TypeError);
});

test("normalization rejects incomplete and invalid confidence results", () => {
  const valid = { race: { black: 1 }, age: { "30-39": 1 }, gender: { female: 1 } };
  for (const value of [null, {}, { ...valid, age: {} }, { ...valid, gender: [] }]) assert.throws(() => normalizeDemographics(value));
  for (const value of [-1, 1.1, NaN, Infinity, "0.9", null]) assert.throws(() => normalizeDemographics({ ...valid, race: { black: value } }));
});

test("confidence percentages always have exactly two decimal places", () => {
  assert.equal(formatConfidence(0), "0.00%");
  assert.equal(formatConfidence(1), "100.00%");
  assert.equal(formatConfidence(0.6315332283), "63.15%");
  assert.equal(formatConfidence(0.0000043818), "0.00%");
});

test("simulated module estimates use the demographic result shape", () => {
  const estimates = simulateEstimates();
  assert.deepEqual(Object.keys(estimates), ["concerns", "skinType", "weather"]);
  for (const [module, categories] of Object.entries(estimateCategories)) {
    assert.deepEqual(Object.keys(estimates[module]), Object.keys(categories));
    for (const [category, labels] of Object.entries(categories)) {
      const scores = estimates[module][category];
      assert.deepEqual(scores.map((score) => score.label).sort(), [...labels].sort());
      assert.deepEqual(scores, [...scores].sort((a, b) => b.confidence - a.confidence));
      assert.ok(Math.abs(scores.reduce((sum, score) => sum + score.confidence, 0) - 1) < 1e-9);
      assert.throws(() => { scores[0].confidence = 0; }, TypeError);
    }
  }
  const fixed = simulateEstimates(() => 0.5);
  assert.equal(fixed.weather.humidity[0].confidence, 1 / 3);
  assert.equal(simulateEstimates(() => 0).concerns.severity[0].confidence, 0);
});
