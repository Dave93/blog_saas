import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
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
        async jwt({ token, user, account, session }) {
            console.log('auth.config jwt', token, user, account, session);
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
    session: { strategy: "jwt" },
    providers: [
        GitHub({

            profile: async (_profile, tokens) => {
                const {
                    data,
                    status,
                    error
                } = await apiClient.api.users.oauth.post({
                    data: {
                        provider: 'github',
                        accessToken: tokens.access_token,
                        tokenType: tokens.token_type,
                        scope: tokens.scope
                    }
                });
                if (status == 200 && data && "accessToken" in data) {
                    return {
                        ...data.user,
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        permissions: data.permissions,
                        role: data.role,
                    }
                } else {
                    return null;
                }
            }
        }),
        Google({
            profile: async (_profile, tokens) => {
                console.log('profile', _profile);
                console.log('tokens', tokens);
                const {
                    data,
                    status,
                    error
                } = await apiClient.api.users.oauth.post({
                    data: {
                        provider: 'google',
                        accessToken: tokens.access_token,
                        tokenType: tokens.token_type,
                        scope: tokens.scope
                    }
                });
                if (status == 200 && data && "accessToken" in data) {
                    return {
                        ...data.user,
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        permissions: data.permissions,
                        role: data.role,
                    }
                } else {
                    return null;
                }
            }
        }),
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
                        console.log('res', res);
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
