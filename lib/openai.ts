import { Configuration, OpenAIApi } from "openai";

export function get_openai() {
  return new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
  );
}
