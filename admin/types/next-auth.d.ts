import NextAuth, { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@backend/../drizzle/schema";
import { DefaultJWT } from "@auth/core/jwt";
interface ExtendedUser extends InferSelectModel<typeof users> {
  accessToken: string;
  refreshToken: string;
  permissions: string[];
  role: {
    id: string;
    code: string;
  } | undefined;
}
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User extends ExtendedUser { }
  interface Session {
    user: User;
    permissions: string[];
    accessToken: string & DefaultSession;
    refreshToken: string;
    role: {
      id: string;
      code: string;
    };
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface User extends ExtendedUser { }
  interface JWT {
    user: User;
    permissions: string[];
    accessToken: string & DefaultJWT;
    refreshToken: string;
    role: {
      id: string;
      code: string;
    };
    exp: number;
    iat: number;
  }
}
