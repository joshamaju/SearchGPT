import { OpenAIApi } from "openai";

import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/ReaderTaskEither";

const bot_name = "AI";

const request = {
  top_p: 1,
  max_tokens: 256,
  presence_penalty: 0,
  frequency_penalty: 0,
  stop: [`${bot_name}:`],
  model: "text-davinci-003",
};

export function createCompletion(prompt: string) {
  return (openai: OpenAIApi) => {
    return pipe(
      TE.tryCatch(
        () => openai.createCompletion({ ...request, prompt }),
        E.toError
      ),
      TE.map((result) => result.data)
      //   TE.map((result) => A.head(result.choices)),
      //   TE.map(O.chain((choice) => O.fromNullable(choice.text)))
    );
  };
}

export function get_answer(prompt: string) {
  return pipe(
    createCompletion(prompt),
    RTE.map((result) => A.head(result.choices)),
    RTE.map(O.chain((choice) => O.fromNullable(choice.text)))
  );
}
