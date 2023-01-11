import { useRouter } from "next/router";

import { Input } from "antd";

function Home() {
  const router = useRouter();

  return (
    <main className="h-full flex flex-col">
      <div className="space-y-16 m-auto lg:w-[40%]">
        <div>
          <h1 className="text-center text-4xl font-bold">AI Search Tool</h1>
        </div>

        <form
          method="get"
          action="/search"
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();

            const data = new FormData(e.target as HTMLFormElement);

            const prompt = data.get("prompt");

            router.push(`/search?q=${prompt}`);
          }}
        >
          <Input
            required
            autoFocus
            type="text"
            size="large"
            name="prompt"
            placeholder="Start typing to search..."
          />
        </form>
      </div>
    </main>
  );
}

export default Home;
