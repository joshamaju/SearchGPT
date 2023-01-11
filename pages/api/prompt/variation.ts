import { NextApiHandler } from "next";

import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import { get_answer } from "../../../core/usecases/get_answer";
import { get_openai } from "../../../lib/openai";

const handler: NextApiHandler = async (req, res) => {
  const { prompt } = req.query;

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return res
      .status(300)
      .json({ error: "Prompt should be a non-empty string" });
  }

  const openai = get_openai();

  const final_prompt = `Generate three variations of this prompt: "${prompt}"`;

  const get_result = get_answer(final_prompt);

  const answer = await get_result(openai)();

  if (E.isLeft(answer)) {
    return res.status(500).json({ error: answer.left.message });
  }

  if (O.isNone(answer.right)) {
    return res.status(204).json({ data: "No result found" });
  }

  const lines = answer.right.value.split("\n");

  const trimmed_lines = lines.filter((line) => line.trim() !== "");

  res.json({ result: answer.right.value, variations: trimmed_lines });
};

export default handler;
