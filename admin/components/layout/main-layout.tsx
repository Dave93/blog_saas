// "use client";
import { ThemeProvider } from "@components/theme-provider";
import { NavigationMenuDemo } from "@components/layout/main-nav";
import { Search } from "lucide-react";
import { UserNav } from "@components/layout/user-nav";
import { ModeToggle } from "@components/layout/mode-toggle";
import { Toaster } from "@components/ui/toaster";
import { Providers } from "@admin/store/provider";
import { useGetRole } from "@admin/utils/get_role";
import AdminLayout from "./admin-layout";
import NoRoleLayout from "./noRole-layout";
import ManagerLayout from "./manager-layout";
import dynamic from "next/dynamic";
import { auth } from "@admin/auth";
import SignInLayout from "./signin-layout";

const NextUIProviderClient = dynamic(
  () => import("@nextui-org/system").then((mod) => mod.NextUIProvider),
  {
    ssr: false,
  }
);

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <Providers>
      <ThemeProvider attribute="class">
        <NextUIProviderClient>
          {session?.user ? (
            <AdminLayout>{children}</AdminLayout>
          ) : (
            <SignInLayout>{children}</SignInLayout>
          )}
          <Toaster />
        </NextUIProviderClient>
      </ThemeProvider>
    </Providers>
  );
}
