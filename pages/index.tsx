import { useRouter } from "next/router";

function Home() {
  const router = useRouter();

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
        <input required type="text" name="prompt" />
        <button type="submit">send</button>
      </form>
    </main>
  );
}

export default Home;
