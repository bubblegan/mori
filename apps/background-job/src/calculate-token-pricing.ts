type Model = "gpt-4o" | "gpt-4o-mini";

export function calculateTokenPricing(
  promptTokens: number,
  completionTokens: number,
  model: Model
): number | undefined {
  if (model === "gpt-4o") {
    const promptTokenPricePerMillion = 2.5;
    const completionTokenPricePerMillion = 10.0;

    const inputTokenCost =
      (promptTokens / 1_000_000) * promptTokenPricePerMillion;
    const completionTokenCost =
      (completionTokens / 1_000_000) * completionTokenPricePerMillion;

    return inputTokenCost + completionTokenCost;
  }
}
