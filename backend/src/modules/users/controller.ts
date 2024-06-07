import Elysia, { error, t } from "elysia";
import { oauth_users, users, users_roles } from "@backend/../drizzle/schema";
import { createHash, createHmac } from "crypto";
import {
  InferSelectModel,
  SQLWrapper,
  and,
  eq,
  getTableColumns,
  or,
  sql,
} from "drizzle-orm";
import {
  comparePassword,
  generateRandomPassword,
  hashPassword,
  signJwt,
  verifyJwt,
} from "@backend/lib/bcrypt";
import { SelectedFields } from "drizzle-orm/pg-core";
import { parseSelectFields } from "@backend/lib/parseSelectFields";
import { parseFilterFields } from "@backend/lib/parseFilterFields";
import { createInsertSchema } from "drizzle-typebox";
import { ctx } from "@backend/context";
import {
  userById,
  userByLogin,
  userFirstRole,
  userPasswordByLogin,
} from "@backend/lib/prepare_statements";
import { getGithubUserData } from "./oauth/oauth_providers";
import { getGoogleUserData } from "./oauth/oauth_google";
import { GithubOauthUserData } from "./oauth/dtos/github";
import { GoogleOauthUserData } from "./oauth/dtos/google";

type UsersModel = InferSelectModel<typeof users>;

function exclude<User extends Record<string, unknown>, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  const filteredEntries = Object.entries(
    user as Record<string, unknown>
  ).filter(([key]) => !keys.includes(key as Key));
  const filteredObject = Object.fromEntries(filteredEntries) as unknown as Omit<
    User,
    Key
  >;
  return filteredObject;
}

export const usersController = new Elysia({
  name: "@api/users",
})
  .use(ctx)
  .post(
    "/users/login",
    async ({ body: { login, password }, set, cacheController }) => {
      const user = (await userByLogin.execute({ login })) as InferSelectModel<
        typeof users
      >;

      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      const userPasswords = await userPasswordByLogin.execute({ login });

      if (!userPasswords!.password) {
        set.status = 401;
        return {
          message: "This type of authentication is not supported",
        };
      }

      const isPasswordSame = await comparePassword(
        password,
        userPasswords!.salt!,
        userPasswords!.password
      );

      if (!isPasswordSame) {
        set.status = 401;
        return {
          message: "Password is incorrect",
        };
      }

      if (!user.active) {
        set.status = 401;
        return {
          message: "User is blocked",
        };
      }
      const accessToken = await signJwt(
        {
          id: user.id,
          login: user.login,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        process.env.JWT_EXPIRES_IN
      );

      const refreshToken = await signJwt(
        {
          id: user.id,
          login: user.login,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        process.env.JWT_REFRESH_EXPIRES_IN
      );
      const res = await cacheController.cacheUserDataByToken(
        accessToken,
        refreshToken,
        user.id
      );
      return res;
    },
    {
      body: t.Object({
        login: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/users/refresh_token",
    async ({ body: { refreshToken }, set, cacheController }) => {
      let jwtResult = await verifyJwt(refreshToken);
      if (!jwtResult) {
        set.status = 401;
        return {
          message: "Invalid token",
        };
      }

      if (!jwtResult.payload) {
        set.status = 401;
        return {
          message: "Invalid token",
        };
      }

      const user = (await userById.execute({
        id: jwtResult.payload.id,
      })) as InferSelectModel<typeof users>;

      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.active) {
        set.status = 401;
        return {
          message: "User is blocked",
        };
      }

      const accessToken = await signJwt(
        {
          id: user.id,
          login: user.login,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        process.env.JWT_EXPIRES_IN
      );

      const refreshTokenNew = await signJwt(
        {
          id: user.id,
          login: user.login,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        process.env.JWT_REFRESH_EXPIRES_IN
      );

      const res = await cacheController.cacheUserDataByToken(
        accessToken,
        refreshTokenNew,
        user.id
      );
      return res;
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  .post(
    "/users/assign_role",
    async ({ body: { user_id, role_id }, user, set, drizzle }) => {
      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.permissions.includes("users.edit")) {
        set.status = 401;
        return {
          message: "You don't have permissions",
        };
      }

      await drizzle
        .delete(users_roles)
        .where(eq(users_roles.user_id, user_id))
        .execute();
      await drizzle.insert(users_roles).values({ user_id, role_id }).execute();
      return {
        data: {
          user_id,
          role_id,
        },
      };
    },
    {
      body: t.Object({
        user_id: t.String(),
        role_id: t.String(),
      }),
    }
  )
  .get(
    "/users",
    async ({
      query: { limit, offset, sort, filters, fields },
      user,
      set,
      drizzle,
    }) => {
      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.permissions.includes("users.list")) {
        set.status = 401;
        return {
          message: "You don't have permissions",
        };
      }
      const result: {
        [key: string]: UsersModel;
      } = {};
      let selectFields: SelectedFields = {};
      if (fields) {
        fields = fields
          .split(",")
          .filter((item) => item != "password")
          .join(",");
        selectFields = parseSelectFields(fields, users, {});
      }
      let whereClause: (SQLWrapper | undefined)[] = [];
      if (filters) {
        whereClause = parseFilterFields(filters, users, {});
      }
      const usersCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(...whereClause))
        .execute();

      const { password, salt, ...usersFields } = getTableColumns(users);

      const usersDbSelect = drizzle
        .select(usersFields)
        .from(users)
        .where(and(...whereClause))
        .limit(+limit)
        .offset(+offset)
        .as("users");

      const usersList = await drizzle
        .select(selectFields)
        .from(usersDbSelect)
        .execute() as UsersModel[];

      usersList.forEach((user) => {
        if (!result[user.id]) {
          result[user.id] = user;
        }
      });

      return {
        total: usersCount[0].count,
        data: Object.values(result),
      };
    },
    {
      query: t.Object({
        limit: t.String(),
        offset: t.String(),
        sort: t.Optional(t.String()),
        filters: t.Optional(t.String()),
        fields: t.Optional(t.String()),
      }),
    }
  )
  .get("/users/me", async ({ user, set, cacheController }) => {
    if (!user) {
      set.status = 401;
      return {
        message: "User not found",
      };
    }
    return user;
  })
  .get(
    "/users/:id",
    async ({
      params: { id },
      // @ts-ignore
      user,
      set,
      drizzle,
    }) => {
      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.permissions.includes("users.one")) {
        set.status = 401;
        return {
          message: "You don't have permissions",
        };
      }
      const { password, salt, ...usersFields } = getTableColumns(users);
      const permissionsRecord = await drizzle
        .select(usersFields)
        .from(users)
        .where(eq(users.id, id))
        .execute();
      return {
        data: permissionsRecord[0],
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post('/users/oauth', async ({ body: { data }, user, set, drizzle, cacheController }) => {
    let userData: GoogleOauthUserData | GithubOauthUserData | null = null;
    switch (data.provider) {
      case 'github':
        if (!data.accessToken) {
          set.status = 401;
          return {
            message: 'Access token is required'
          };
        }
        userData = await getGithubUserData(data.accessToken);
        break;
      case 'google':
        if (!data.accessToken) {
          set.status = 401;
          return {
            message: 'Access token is required'
          };
        }
        userData = await getGoogleUserData(data.accessToken);
        break;

    }
    if (!userData) {
      set.status = 401;
      return {
        message: 'User not found'
      };
    } else {
      const providerUser = await drizzle
        .select()
        .from(oauth_users)
        .where(
          and(
            eq(oauth_users.provider, data.provider),
            or(
              userData.login ? eq(oauth_users.login, userData.login) : undefined,
              userData.email ? eq(oauth_users.email, userData.email) : undefined
            ),
            eq(oauth_users.provider_user_id, userData.id!.toString())
          )
        )
        .execute();
      let currentUser: {
        id: string;
        login: string | null;
        first_name: string | null;
        last_name: string | null;
      } | null = null;
      if (providerUser.length) {
        const existingUser = await drizzle.select({
          id: users.id,
          login: users.login,
          first_name: users.first_name,
          last_name: users.last_name,
        })
          .from(users)
          .where(eq(users.id, providerUser[0].user_id!))
          .execute();
        currentUser = existingUser[0];
      } else {

        const existingUser = await drizzle.select({
          id: users.id,
          login: users.login,
          first_name: users.first_name,
          last_name: users.last_name,
        })
          .from(users)
          .where(eq(users.email, userData.email))
          .execute();
        if (existingUser.length) {
          currentUser = existingUser[0];
        } else {

          const newUser = await drizzle.insert(users).values({
            email: userData.email,
            login: userData.login,
            first_name: userData.name ?? userData.login,
            avatar: userData.avatar_url,
            created_at: new Date().toISOString(),
          }).returning({
            id: users.id,
            login: users.login,
            first_name: users.first_name,
            last_name: users.last_name,
          }).execute();
          currentUser = newUser[0];
        }
        await drizzle.insert(oauth_users).values({
          user_id: currentUser.id,
          provider: data.provider,
          provider_user_id: userData.id.toString(),
          login: userData.login,
          email: userData.email,
          created_at: new Date().toISOString(),
        }).execute();
      }

      const accessToken = await signJwt(
        {
          id: currentUser.id,
          login: currentUser.login,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
        },
        process.env.JWT_EXPIRES_IN
      );

      const refreshToken = await signJwt(
        {
          id: currentUser.id,
          login: currentUser.login,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
        },
        process.env.JWT_REFRESH_EXPIRES_IN
      );
      const res = await cacheController.cacheUserDataByToken(
        accessToken,
        refreshToken,
        currentUser.id
      );
      return res;
    }

    return {

    };
  }, {
    body: t.Object({
      data: t.Object({
        provider: t.String(),
        accessToken: t.Optional(t.String()),
        tokenType: t.Optional(t.String()),
        scope: t.Optional(t.String()),
      })
    })
  })
  .post(
    "/users",
    async ({ body: { data, fields }, user, set, drizzle }) => {
      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.permissions.includes("users.add")) {
        set.status = 401;
        return {
          message: "You don't have permissions",
        };
      }
      if (data.password) {
        const { hash, salt } = await hashPassword(data.password);
        data.password = hash;
        data.salt = salt;
      }
      let selectFields = {};
      if (fields) {
        selectFields = parseSelectFields(fields, users, {});
      } else {
        selectFields = {
          id: users.id,
        };
      }
      const result = await drizzle
        .insert(users)
        .values(data)
        .returning(selectFields);

      return result[0];
    },
    {
      body: t.Object({
        data: createInsertSchema(users) as any,
        fields: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .put(
    "/users/:id",
    async ({ params: { id }, body: { data, fields }, user, set, drizzle }) => {
      if (!user) {
        set.status = 401;
        return {
          message: "User not found",
        };
      }

      if (!user.permissions.includes("users.edit")) {
        set.status = 401;
        return {
          message: "You don't have permissions",
        };
      }
      let selectFields = {};
      if (fields) {
        selectFields = parseSelectFields(fields, users, {});
      }

      if (data.password) {
        let password = data.password;
        if (typeof password != "string") {
          password = password.set!;
        }
        const { hash, salt } = await hashPassword(password);
        data.password = hash;
        data.salt = salt;
      }

      const result = await drizzle
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning(selectFields);

      return {
        data: result[0],
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        // @ts-ignore
        data: createInsertSchema(users) as any,
        fields: t.Optional(t.Array(t.String())),
      }),
    }
  );
