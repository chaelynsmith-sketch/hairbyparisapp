const { getProductRecommendations } = require("../services/ai.service");

async function askAssistant(req, res) {
  const result = await getProductRecommendations({
    storeId: req.storeId,
    prompt: req.body.message,
    preferences: {
      ...(req.user?.preferences?.chatbotContext || {}),
      ...(req.body.preferences || {})
    }
  });

  res.json(result);
}

module.exports = { askAssistant };
