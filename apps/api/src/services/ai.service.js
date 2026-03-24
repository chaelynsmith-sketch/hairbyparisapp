const OpenAI = require("openai");
const { Product } = require("../models/product.model");

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function getProductRecommendations({ storeId, prompt, preferences = {} }) {
  const products = await Product.find({ storeId, status: "active" })
    .select("name category description recommendationSignals pricing")
    .limit(12);

  if (!client) {
    // The mock path keeps the app functional in local/dev environments without an OpenAI key.
    return {
      answer:
        "I recommend starting with moisture-focused care, heat protection, and texture-matched options based on your preferences.",
      recommendedProducts: products.slice(0, 4)
    };
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are a hair and beauty shopping assistant. Recommend products grounded in the supplied catalog and respond concisely."
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt,
          preferences,
          catalog: products
        })
      }
    ]
  });

  return {
    answer: response.output_text,
    recommendedProducts: products.slice(0, 4)
  };
}

module.exports = { getProductRecommendations };
