import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"
import { JWT } from "next-auth/jwt"
import { users } from "backend/drizzle/schema";
import { InferSelectModel } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";
import { apiClient } from "./utils/eden";

interface ExtendedUser extends InferSelectModel<typeof users> {
    accessToken: string;
    refreshToken: string;
    permissions: string[];
    role: {
        id: string;
        code: string;
    } | undefined;
}

export default {
    callbacks: {
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl
            return !!auth
        },
    },
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
                        console.log("res", res);
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
        }),]
} satisfies NextAuthConfig



declare module "next-auth" {
    interface User extends ExtendedUser { }
    interface Session {
        user: User;
        permissions: string[];
        accessToken: string;
        refreshToken: string;
        role: {
            id: string;
            code: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface User extends ExtendedUser { }
    interface JWT {
        user: User;
        permissions: string[];
        accessToken: string;
        refreshToken: string;
        role: {
            id: string;
            code: string;
        };
        exp: number;
        iat: number;
    }
}