import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { Configuration, OpenAIApi } from "openai";

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

  console.log(ctx.query);

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const api = new OpenAIApi(configuration);

  const bot_name = "AI";

  const final_prompt = `Generate three variations of this prompt: "${q}"`;

  const payload = {
    top_p: 1,
    max_tokens: 256,
    presence_penalty: 0,
    frequency_penalty: 0,
    prompt: final_prompt,
    stop: [`${bot_name}:`],
    model: "text-davinci-003",
    // user: req.body?.user,
    // temperature: process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.7,
  };

  const response = await api.createCompletion({
    ...payload,
    prompt: get_prompt(q),
  });

  const variation_response = await api.createCompletion(payload);

  const [choice] = variation_response.data.choices;

  const lines = choice.text?.split("\n");

  const trimmed_lines = lines?.filter((line) => line.trim() !== "");

  let variations: { prompt: string; result?: string }[] = [];

  console.log(response.data, get_prompt(q));

  if (trimmed_lines) {
    const new_result = await Promise.all(
      trimmed_lines.map(async (line) => {
        const result = await api.createCompletion({
          ...payload,
          prompt: get_prompt(line),
        });
        return { prompt: line, result: result.data.choices[0].text };
      })
    );

    // console.log(
    //   response.data,
    //   inspect(new_result, false, Infinity),
    //   inspect(
    //     new_result.map((r) => r.result?.match(url_regex)),
    //     false,
    //     Infinity
    //   )
    // );

    variations = new_result.map((result) => {
      return {
        ...result,
        links: ([] as string[]).concat(result.result?.match(url_regex) ?? []),
      };
    });
  }

  const text = response.data.choices[0].text;

  return {
    props: {
      prompt: q,
      variations,
      result: response.data.choices[0].text,
      links: ([] as string[]).concat(text?.match(url_regex) ?? []),
    },
  };
};

function Search(
  props: Awaited<ReturnType<typeof getServerSideProps>>["props"]
) {
  const router = useRouter();

  console.log(props);

  return (
    <main>
      <form
        method="get"
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();

          const data = new FormData(e.target as HTMLFormElement);

          const prompt = data.get("prompt");

          router.push(`/search?q=${prompt}`);
        }}
      >
        <input required type="text" name="prompt" defaultValue={props.prompt} />
        <button type="submit">send</button>
      </form>

      <div>
        <h3>{props.result}</h3>

        {props.links.length > 0 ? (
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
        ) : null}

        <section>
          <h4>Additional Results</h4>

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
        </section>
      </div>
    </main>
  );
}

export default Search;
