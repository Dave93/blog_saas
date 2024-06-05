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

const NextUIProviderClient = dynamic(
  () => import("@nextui-org/system").then((mod) => mod.NextUIProvider),
  {
    ssr: false,
  }
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <NextUIProviderClient>
          <AdminLayout>{children}</AdminLayout>
          <Toaster />
        </NextUIProviderClient>
      </ThemeProvider>
    </Providers>
  );
}
