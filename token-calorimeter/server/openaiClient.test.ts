import { afterEach, describe, expect, it } from "vitest";
import { createModelClient } from "./openaiClient";

describe("openai client setup", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalTestMode = process.env.TOKEN_CALORIMETER_TEST_MODE;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    process.env.TOKEN_CALORIMETER_TEST_MODE = originalTestMode;
  });

  it("fails clearly when the server API key is missing outside deterministic test mode", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.TOKEN_CALORIMETER_TEST_MODE;

    expect(() => createModelClient()).toThrow(/Missing OPENAI_API_KEY/);
  });
});
