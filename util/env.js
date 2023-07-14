import { config } from "dotenv";

export const initEnv = () => {
  config();

  return {
    port: process.env.PORT || 3000,
  };
};
