import { DrizzleDB } from "@backend/lib/db";
import { InferSelectModel, eq, getTableColumns } from "drizzle-orm";
import {
  credentials,
  permissions,
  roles,
  roles_permissions,
  settings,
  users,
} from "@backend/../drizzle/schema";
import { RolesWithRelations } from "../roles/dto/roles.dto";
import { verifyJwt } from "@backend/lib/bcrypt";
import { userById, userFirstRole } from "@backend/lib/prepare_statements";
import Redis from "ioredis";

export class CacheControlService {
  constructor(
    private readonly drizzle: DrizzleDB,
    private readonly redis: Redis
  ) {
    this.cachePermissions();
    this.cacheRoles();
    this.cacheSettings();
    this.cacheCredentials();
  }

  async cachePermissions() {
    const permissions = await this.drizzle.query.permissions.findMany();
    await this.redis.set(
      `${process.env.PROJECT_PREFIX}permissions`,
      JSON.stringify(permissions)
    );
  }

  async getCachedPermissions({ take }: { take?: number }) {
    const permissionsList = await this.redis.get(
      `${process.env.PROJECT_PREFIX}permissions`
    );
    let res = JSON.parse(permissionsList ?? "[]") as InferSelectModel<
      typeof permissions
    >[];

    if (take && res.length > take) {
      res = res.slice(0, take);
    }

    return res;
  }

  async cacheRoles() {
    const rolesList = await this.drizzle
      .select({
        id: roles.id,
        name: roles.name,
        code: roles.code,
        active: roles.active,
      })
      .from(roles)
      .execute();

    const rolesPermissionsList = await this.drizzle
      .select({
        slug: permissions.slug,
        role_id: roles_permissions.role_id,
      })
      .from(roles_permissions)
      .leftJoin(
        permissions,
        eq(roles_permissions.permission_id, permissions.id)
      )
      .execute();

    const rolesPermissions = rolesPermissionsList.reduce(
      (acc: any, cur: any) => {
        if (!acc[cur.role_id]) {
          acc[cur.role_id] = [];
        }
        acc[cur.role_id].push(cur.slug);
        return acc;
      },
      {}
    );

    const res = rolesList.map((role: any) => {
      return {
        ...role,
        permissions: rolesPermissions[role.id] || [],
      };
    });
    await this.redis.set(
      `${process.env.PROJECT_PREFIX}_roles`,
      JSON.stringify(res)
    );
  }

  async getCachedRoles({ take }: { take?: number }) {
    const rolesList = await this.redis.get(
      `${process.env.PROJECT_PREFIX}_roles`
    );
    let res = JSON.parse(rolesList ?? "[]") as RolesWithRelations[];

    if (take && res.length > take) {
      res = res.slice(0, take);
    }

    return res;
  }

  async getPermissionsByRoleId(roleId: string) {
    if (!roleId) {
      return [];
    }

    const roles = await this.getCachedRoles({});
    // console.log("roles", roles);
    const role = roles.find((role) => role.id === roleId);
    if (!role) {
      return [];
    }
    return role.permissions;
  }

  async cacheSettings() {
    const settingsList = await this.drizzle.query.settings.findMany({});
    await this.redis.set(
      `${process.env.PROJECT_PREFIX}settings`,
      JSON.stringify(settingsList)
    );
  }

  async getCachedSettings({ take }: { take?: number }) {
    const settingsList = await this.redis.get(
      `${process.env.PROJECT_PREFIX}settings`
    );
    let res = JSON.parse(settingsList ?? "[]") as InferSelectModel<
      typeof settings
    >[];

    if (take && res.length > take) {
      res = res.slice(0, take);
    }

    return res;
  }

  async cacheCredentials() {
    const credentials = await this.drizzle.query.credentials.findMany();
    await this.redis.set(
      `${process.env.PROJECT_PREFIX}credentials`,
      JSON.stringify(credentials)
    );
  }

  async getCachedCredentials({ take }: { take?: number }) {
    const credentialsList = await this.redis.get(
      `${process.env.PROJECT_PREFIX}credentials`
    );
    let res = JSON.parse(credentialsList ?? "[]") as InferSelectModel<
      typeof credentials
    >[];

    if (take && res.length > take) {
      res = res.slice(0, take);
    }

    return res;
  }

  async cacheUserDataByToken(
    accessToken: string,
    refreshToken: string,
    userId: any
  ) {
    const foundUser = (await userById.execute({
      id: userId,
    })) as InferSelectModel<typeof users>;
    if (!foundUser) {
      return null;
    }

    if (foundUser.status != "active") {
      return null;
    }

    const userRole = await userFirstRole.execute({ user_id: foundUser.id });

    // getting rights
    let permissions: string[] = [];
    if (userRole) {
      permissions = await this.getPermissionsByRoleId(userRole.role_id);
    }
    await this.redis.set(
      `${process.env.PROJECT_PREFIX}user_data:${accessToken}`,
      JSON.stringify({
        user: foundUser,
        accessToken,
        refreshToken,
        permissions: permissions,
        role: {
          id: userRole?.role_id,
          code: userRole?.role?.code,
        },
      })
    );

    return {
      user: foundUser,
      accessToken,
      refreshToken,
      permissions: permissions,
      role: {
        id: userRole?.role_id,
        code: userRole?.role?.code,
      },
    };
  }

  async deleteUserDataByToken(accessToken: string) {
    try {
      await this.redis.del(
        `${process.env.PROJECT_PREFIX}user_data:${accessToken}`
      );
    } catch (e) {}
  }

  async getCachedUserDataByToken(accessToken: string): Promise<{
    user: InferSelectModel<typeof users>;
    accessToken: string;
    refreshToken: string;
    permissions: string[];
  } | null> {
    try {
      let jwtResult = await verifyJwt(accessToken);
      if (!jwtResult.payload.id) {
        return null;
      }
      const data = await this.redis.get(
        `${process.env.PROJECT_PREFIX}user_data:${accessToken}`
      );
      if (data) {
        return JSON.parse(data);
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
