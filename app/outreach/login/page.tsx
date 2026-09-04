import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in | PPC Keyword Utilities Suite" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/outreach") ? next : "/outreach";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-md px-4 py-16 outline-none sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <div className="mt-6">
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
