import { auth } from "@admin/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import ReactQueryProvider from "./react-query.provider";

export async function Providers({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider basePath={"/auth"} session={session}>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </SessionProvider>
  );
}
