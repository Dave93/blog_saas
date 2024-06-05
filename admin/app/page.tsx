"use client";

import { useGetRole } from "@admin/utils/get_role";

export default function Home() {
  const roleCode = useGetRole();
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        this is the home page
      </main>
    </>
  );
}
