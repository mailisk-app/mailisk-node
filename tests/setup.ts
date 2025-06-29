import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

jest.setTimeout(10000);

process.env.TEST_MODE = "true";

export const createTestClient = (mockResponses = {}) => {
  const { MailiskClient } = require("../src/mailisk");

  return new MailiskClient({
    apiKey: "test-api-key",
    baseUrl: "https://test-api.mailisk.com/",
  });
};

afterEach(() => {
  jest.resetAllMocks();
});
