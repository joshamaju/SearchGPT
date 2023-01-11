import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { get_answer } from "../../core/usecases/get_answer";
import { get_openai } from "../../lib/openai";

import axios from "axios";

import { Button, Empty, Input, Skeleton } from "antd";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { useQuery } from "react-query";

type IOError = {};

type NetworkError = {};

function get_prompt(prompt: string) {
  return `
    ${prompt}.

    Include relevant links
    `;
}

const url_regex = /(https?:\/\/[^\s]+)/g;

export const getServerSideProps = async function (
  ctx: GetServerSidePropsContext
) {
  const { q } = ctx.query;

  if (typeof q !== "string" || q.trim() === "") {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const openai = get_openai();

  const get_result = get_answer(q);

  const answer = await get_result(openai)();

  if (E.isLeft(answer)) {
    return {
      props: {
        data: { prompt: q },
        fatal_error: answer.left.message,
      },
    };
  }

  return {
    props: {
      not_found: O.isNone(answer.right),
      data: {
        prompt: q,
        answer: pipe(
          answer.right,
          O.getOrElse(() => "")
        ),
      },
    },
  };

  // let variations: { prompt: string; result?: string }[] = [];

  // console.log(response.data, get_prompt(q));

  // if (trimmed_lines) {
  //   const new_result = await Promise.all(
  //     trimmed_lines.map(async (line) => {
  //       const result = await api.createCompletion({
  //         ...payload,
  //         prompt: get_prompt(line),
  //       });
  //       return { prompt: line, result: result.data.choices[0].text };
  //     })
  //   );

  //   // console.log(
  //   //   response.data,
  //   //   inspect(new_result, false, Infinity),
  //   //   inspect(
  //   //     new_result.map((r) => r.result?.match(url_regex)),
  //   //     false,
  //   //     Infinity
  //   //   )
  //   // );

  //   variations = new_result.map((result) => {
  //     return {
  //       ...result,
  //       links: ([] as string[]).concat(result.result?.match(url_regex) ?? []),
  //     };
  //   });
  // }

  // const text = response.data.choices[0].text;

  // return {
  //   props: {
  //     prompt: q,
  //     variations,
  //     result: response.data.choices[0].text,
  //     links: ([] as string[]).concat(text?.match(url_regex) ?? []),
  //   },
  // };
};

function Search(
  props:
    | { fatal_error: string; data: { prompt: string } }
    | {
        not_found: boolean;
        data: { prompt: string; answer: string };
      }
) {
  const router = useRouter();

  const { prompt } = props.data;

  const variations = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ["variations", prompt],
    enabled:
      !("fatal_error" in props) &&
      (!("not_found" in props) || !props.not_found),
    async queryFn() {
      const result = await axios.get<{ results: string; variations: string[] }>(
        "/api/prompt/variation",
        { params: { prompt } }
      );

      return result.data;
    },
  });

  const variations_and_results = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ["variations_and_results", prompt],
    enabled: variations.data ? variations.data.variations.length > 0 : false,
    queryFn() {
      return Promise.all(
        variations.data!.variations.map(async (prompt) => {
          const result = await axios.get<string>("/api/prompt/answer", {
            params: { prompt },
          });

          return { prompt, result: result.data };
        })
      );
    },
  });

  console.log(props, variations.data, variations_and_results.data);

  return (
    <div>
      <header className="p-4 bg-white border-b">
        <form
          method="get"
          action="/search"
          className="lg:w-[40%]"
          onSubmit={(e) => {
            e.preventDefault();

            const data = new FormData(e.target as HTMLFormElement);

            const prompt = data.get("prompt");

            router.push(`/search?q=${prompt}`);
          }}
        >
          <Input required type="search" name="prompt" defaultValue={prompt} />
        </form>
      </header>

      <main className="p-4">
        <div className="space-y-4 lg:w-[80%] mx-auto">
          {"fatal_error" in props ? (
            <div className="py-[20%] space-y-4 flex flex-col items-center justify-center">
              <p className="text-xl text-center text-gray-300">
                An error occurred while processing your search
              </p>

              <Button onClick={() => router.reload()}>Try again</Button>
            </div>
          ) : "not_found" in props && props.not_found ? (
            <div>
              <h5 className="text-xl py-6">
                Your search - <strong>{prompt}</strong> - did not yield any
                results
              </h5>

              <section className="space-y-4">
                <h2>Suggestions:</h2>

                <ul className="ml-[2rem] list-decimal">
                  <li>Try different keywords.</li>
                  <li>Try different prompts.</li>
                  <li>Add more details to your prompt</li>
                </ul>
              </section>
            </div>
          ) : (
            <>
              <p className="text-lg">{props.data.answer}</p>

              <section className="space-y-3">
                <h4 className="text-lg font-semibold">Additional Results</h4>

                {variations_and_results.isLoading ? (
                  <div className="space-y-10">
                    <Skeleton active />
                    <Skeleton active />
                    <Skeleton active />
                  </div>
                ) : variations_and_results.data ? (
                  variations_and_results.data.length > 0 ? (
                    <ul className="space-y-6 ml-[2rem]">
                      {variations_and_results.data.map((data, i) => {
                        return (
                          <li
                            key={i}
                            className="space-y-2 border rounded-md p-4 text-gray-700"
                          >
                            {/* <h5 className="text-md font-semibold">
                            {data.prompt}
                          </h5> */}
                            <p>{data.result}</p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="p-4">
                      <Empty />
                    </div>
                  )
                ) : null}
              </section>
            </>
          )}

          {/* {props?.links && props.links.length > 0 ? (
          <>
            <h6>Links:</h6>

            <ul>
              {props.links.map((link, i) => {
                return (
                  <a key={i} href={link} target="_blank" rel="noreferrer">
                    {link}
                  </a>
                );
              })}
            </ul>
          </>
        ) : null} */}

          {/* <section>
          <h4>Additional Results</h4>

          {props?.variations ? (
            <ul>
              {props.variations.map((result, i) => {
                return (
                  <li key={i}>
                    <h4>{result.prompt}</h4>
                    <p>{result.result}</p>

                    {props.links.length > 0 ? (
                      <>
                        <h6>Links:</h6>

                        <ul>
                          {props.links.map((link, i) => {
                            return (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {link}
                              </a>
                            );
                          })}
                        </ul>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section> */}
        </div>
      </main>
    </div>
  );
}

export default Search;
