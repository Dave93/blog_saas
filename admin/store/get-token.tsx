import { useSession } from "next-auth/react";

export default function useToken() {
  const { data: sessionData } = useSession();
  console.log("sessionData", sessionData);
  if (!sessionData) return null;
  if (typeof sessionData.accessToken !== "string") {
    return null;
  }

  return sessionData.accessToken;
}
