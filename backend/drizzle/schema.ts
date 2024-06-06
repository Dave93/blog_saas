import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
  text,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: varchar("description", { length: 60 }).notNull(),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    created_by: uuid("created_by"),
    updated_by: uuid("updated_by"),
  },
  (table) => {
    return {
      UQ_d090ad82a0e97ce764c06c7b312: uniqueIndex(
        "UQ_d090ad82a0e97ce764c06c7b312"
      ).on(table.slug),
    };
  }
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    code: varchar("code", { length: 50 }),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    created_by: uuid("created_by"),
    updated_by: uuid("updated_by"),
  },
  (table) => {
    return {
      UQ_0e2c0e1b4b0b0b0b0b0b0b0b0b0: uniqueIndex(
        "UQ_0e2c0e1b4b0b0b0b0b0b0b0b0b0"
      ).on(table.code),
      UQ_648e3f5447f725579d7d4ffdfb7: uniqueIndex(
        "UQ_648e3f5447f725579d7d4ffdfb7"
      ).on(table.name),
    };
  }
);

export const settings = pgTable(
  "settings",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    is_secure: boolean("is_secure").default(false).notNull(),
    created_at: timestamp("created_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      key_key: uniqueIndex("settings_key_key").on(table.key),
    };
  }
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    active: boolean("active").default(true).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 100 }).notNull(),
    login: varchar("login", { length: 100 }),
    first_name: varchar("first_name", { length: 100 }),
    last_name: varchar("last_name", { length: 100 }),
    password: varchar("password").notNull(),
    salt: varchar("salt"),
    birth_date: timestamp("birth_date", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    }),
    created_at: timestamp("created_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      precision: 5,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      UQ_0e2c0e1b3b0b0b0b0b0b0b0b0b0: uniqueIndex(
        "UQ_0e2c0e1b3b0b0b0b0b0b0b0b0b0"
      ).on(table.login),
      UQ_0e2c0e1b4b5b0b0b0b0b0b0b0b0: uniqueIndex(
        "UQ_0e2c0e1b4b5b0b0b0b0b0b0b0b0"
      ).on(table.email),
      UQ_a000cca60bcf04454e727699490: uniqueIndex(
        "UQ_a000cca60bcf04454e727699490"
      ).on(table.phone),
      fki_users_login: index("fki_users_login").on(table.login),
    };
  }
);

export const roles_permissions = pgTable(
  "roles_permissions",
  {
    role_id: uuid("role_id").notNull(),
    permission_id: uuid("permission_id").notNull(),
    created_by: uuid("created_by"),
    updated_by: uuid("updated_by"),
  },
  (table) => {
    return {
      PK_0cd11f0b35c4d348c6ebb9b36b7: primaryKey({
        columns: [table.role_id, table.permission_id],
        name: "PK_0cd11f0b35c4d348c6ebb9b36b7",
      }),
    };
  }
);

export const users_permissions = pgTable(
  "users_permissions",
  {
    user_id: uuid("user_id").notNull(),
    permission_id: uuid("permission_id").notNull(),
    created_by: uuid("created_by"),
    updated_by: uuid("updated_by"),
  },
  (table) => {
    return {
      PK_7f3736984cd8546a1e418005561: primaryKey({
        columns: [table.user_id, table.permission_id],
        name: "PK_7f3736984cd8546a1e418005561",
      }),
    };
  }
);

export const users_roles = pgTable(
  "users_roles",
  {
    user_id: uuid("user_id").notNull(),
    role_id: uuid("role_id").notNull(),
    created_by: uuid("created_by"),
    updated_by: uuid("updated_by"),
  },
  (table) => {
    return {
      PK_c525e9373d63035b9919e578a9c: primaryKey({
        columns: [table.user_id, table.role_id],
        name: "PK_c525e9373d63035b9919e578a9c",
      }),
    };
  }
);

export const usersToUsersRelations = relations(users_roles, ({ one }) => ({
  role: one(roles, {
    fields: [users_roles.role_id],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [users_roles.user_id],
    references: [users.id],
  }),
}));
