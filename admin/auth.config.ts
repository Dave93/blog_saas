import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"
import { JWT } from "next-auth/jwt"
import { users } from "backend/drizzle/schema";
import { InferSelectModel } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";
import { apiClient } from "./utils/eden";


export default {
    debug: true,
    basePath: "/api/auth",
    callbacks: {
        authorized({ request, auth }) {
            return !!auth
        },
        async session({ session, token }) {
            console.log('auth.config session', session, token);
            // if (typeof token !== "undefined") {
            //     session = {
            //         ...session,
            //         ...token,
            //     };
            // }
            return session;
        },
        async jwt({ token, user, account }) {
            console.log('auth.config jwt', token, user, account);
            // if (token && token.exp) {
            //     const differenceInMinutes = dayjs
            //         .unix(token!.exp!)
            //         .diff(dayjs(), "minute");

            //     if (differenceInMinutes < 30) {
            //         // @ts-ignore
            //         // const res = await trpcClient.users.refreshToken.mutate({
            //         //   refreshToken: token.refreshToken as string,
            //         // });
            //         // if (typeof res !== "undefined") {
            //         //   /** @ts-ignore */
            //         //   token = {
            //         //     ...token,
            //         //     ...res.data,
            //         //     accessToken: res.accessToken,
            //         //     refreshToken: res.refreshToken,
            //         //     rights: res.rights,
            //         //   };
            //         // }
            //     }
            // }

            // if (typeof user !== "undefined") {
            //     token = {
            //         ...token,
            //         ...user,
            //         // accessToken: user.accessToken,
            //         // refreshToken: user.refreshToken,
            //         // rights: user.rights,
            //         // token: user.token,
            //     };
            // }
            return token;
        },
    },
    session: { strategy: "jwt", maxAge: 2 * 60 * 60 },
    providers: [
        GitHub,
        Credentials({
            name: "Credentials",
            credentials: {
                login: { label: "Login", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (typeof credentials !== "undefined") {
                    const { login, password } = credentials;
                    try {
                        const { data: res, status } = await apiClient.api.users.login.post({
                            login: login!.toString(),
                            password: password!.toString(),
                        });
                        if (status == 200 && res && "accessToken" in res) {
                            return {
                                ...res.user,
                                accessToken: res.accessToken,
                                refreshToken: res.refreshToken,
                                permissions: res.permissions,
                                role: res.role,
                            };
                        } else if (status == 401) {
                            throw new Error("Неверный логин или пароль");
                        } else {
                            return null;
                        }
                    } catch (error) {
                        return null;
                    }
                } else {
                    return null;
                }
            },
        }),
    ]
} satisfies NextAuthConfig
