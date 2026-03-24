require("dotenv").config();
const { createApp } = require("./app");
const { connectDatabase } = require("./config/database");
const { logger } = require("./config/logger");
const { seedDevelopmentData } = require("./services/seed.service");

const port = process.env.PORT || 4000;

async function bootstrap() {
  await connectDatabase();
  await seedDevelopmentData();
  const app = createApp();
  app.listen(port, () => {
    logger.info({ port }, "API server listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
