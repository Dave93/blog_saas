import { DrizzleDB } from "@backend/lib/db";
import { InferSelectModel, eq, getTableColumns } from "drizzle-orm";
import {
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
  private redis: Redis | undefined;
  constructor(private readonly drizzle: DrizzleDB) {
    this.init();
  }

  async init() {
    await this.initRedis();
    this.cachePermissions();
    this.cacheRoles();
    this.cacheSettings();
  }

  async initRedis() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    } else if (process.env.REDIS_LOCAL_HOST && process.env.REDIS_LOCAL_PORT) {
      console.log("REDIS_LOCAL_HOST", process.env.REDIS_LOCAL_HOST);
      console.log("REDIS_LOCAL_PORT", process.env.REDIS_LOCAL_PORT);
      this.redis = new Redis({
        host: process.env.REDIS_LOCAL_HOST,
        port: +process.env.REDIS_LOCAL_PORT,
      });
    } else {
      throw new Error("Redis is not configured");
    }
  }

  getRedis() {
    if (this.redis !== undefined) {
      return this.redis;
    } else {
      throw new Error("Redis is not configured");
    }
  }

  async cachePermissions() {
    const redis = this.getRedis();
    if (redis) {
      const permissionsList = await this.drizzle.query.permissions.findMany();
      for (const permission of permissionsList) {
        await redis.hmset(`permission:${permission.id}`, permission);
        await redis.rpush("permissions", permission.id);
      }
    }
  }

  async getCachedPermissions({ take }: { take?: number }) {
    const redis = this.getRedis();
    if (redis) {
      let permissionsList: InferSelectModel<typeof permissions>[] = [];
      let permissionIds = await redis.lrange("permissions", 0, take ?? -1);
      for (const permissionId of permissionIds) {
        const permission = await redis.hgetall(`permission:${permissionId}`);

        permissionsList.push({
          active: permission.active === "true",
          slug: permission.slug,
          description: permission.description,
          created_at: permission.created_at,
          updated_at: permission.updated_at,
          id: permissionId,
          created_by: permission.created_by,
          updated_by: permission.updated_by,
        });
      }
      return permissionsList;
    }
  }

  async cacheRoles() {
    const redis = this.getRedis();
    if (redis) {
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

      for (const role of rolesList) {
        await redis.hmset(`role:${role.id}`, role);
        await redis.rpush("roles", role.id);
      }

      const permissionSlugsByRoleId = rolesPermissionsList.reduce(
        (acc, rolePermission) => {
          if (!acc[rolePermission.role_id]) {
            acc[rolePermission.role_id] = [];
          }
          acc[rolePermission.role_id].push(rolePermission.slug!);
          return acc;
        },
        {} as Record<string, string[]>
      );

      for (const [roleId, permissionSlugs] of Object.entries(
        permissionSlugsByRoleId
      )) {
        await redis.sadd(`role_permission:${roleId}`, ...permissionSlugs);
      }
    }
  }

  async getCachedRoles({ take }: { take?: number }) {
    const redis = this.getRedis();
    if (redis) {
      let rolesList: InferSelectModel<typeof roles>[] = [];
      let roleIds = await redis.lrange("roles", 0, take ?? -1);
      for (const roleId of roleIds) {
        const role = await redis.hgetall(`role:${roleId}`);

        rolesList.push({
          active: role.active === "true",
          name: role.name,
          code: role.code,
          created_at: role.created_at,
          updated_at: role.updated_at,
          id: roleId,
          created_by: role.created_by,
          updated_by: role.updated_by,
        });
      }
      return rolesList;
    }
  }

  async getPermissionsByRoleId(roleId: string) {
    if (!roleId) {
      return [];
    }

    const redis = this.getRedis();
    if (redis) {
      const rolePermissions = await redis.smembers(`role_permission:${roleId}`);
      return rolePermissions;
    } else {
      return [];
    }
  }

  async cacheSettings() {
    const redis = this.getRedis();
    if (redis) {
      const settingsList = await this.drizzle.query.settings.findMany({});
      for (const setting of settingsList) {
        await redis.hmset(`setting:${setting.id}`, setting);
        await redis.rpush("settings", setting.id);
      }
    }
  }

  async getCachedSettings({ take }: { take?: number }) {
    const redis = this.getRedis();
    if (redis) {
      let settingsList: InferSelectModel<typeof settings>[] = [];
      let settingIds = await redis.lrange("settings", 0, take ?? -1);
      for (const settingId of settingIds) {
        const setting = await redis.hgetall(`setting:${settingId}`);

        settingsList.push({
          id: settingId,
          key: setting.key,
          value: setting.value,
          is_secure: setting.is_secure === "true",
          created_at: setting.created_at,
          updated_at: setting.updated_at,
        });
      }
      return settingsList;
    }
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

    if (!foundUser) {
      return null;
    }

    const redis = this.getRedis();
    if (redis) {
      const userRole = await userFirstRole.execute({ user_id: foundUser.id });

      // getting rights
      let permissions: string[] = [];
      if (userRole) {
        permissions =
          (await this.getPermissionsByRoleId(userRole.role_id)) ?? [];
      }
      await redis.set(
        `user_data:${accessToken}`,
        JSON.stringify({
          user: foundUser,
          accessToken,
          refreshToken,
          permissions: permissions,
          role: userRole && {
            id: userRole.role_id!,
            code: userRole.role.code!,
          },
        })
      );

      return {
        user: foundUser,
        accessToken,
        refreshToken,
        permissions: permissions,
        role: userRole && {
          id: userRole.role_id!,
          code: userRole.role.code!,
        },
      };
    }
  }

  async deleteUserDataByToken(accessToken: string) {
    try {
      const redis = this.getRedis();
      if (redis) {
        await redis.del(`user_data:${accessToken}`);
      }
    } catch (e) { }
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

      const redis = this.getRedis();
      if (redis) {
        const userData = await redis.get(`user_data:${accessToken}`);
        if (userData) {
          return JSON.parse(userData);
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
