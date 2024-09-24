import Elysia, { t } from "elysia";
import { blog } from "backend/drizzle/schema";
import { SQLWrapper, sql, and, eq, InferSelectModel } from "drizzle-orm";
import { SelectedFields } from "drizzle-orm/pg-core";
import { ctx } from "@backend/context";
import { parseFilterFields } from "@backend/lib/parseFilterFields";
import { parseSelectFields } from "@backend/lib/parseSelectFields";
import { createInsertSchema } from "drizzle-typebox";

export const blogController = new Elysia({
  name: "@api/blog",
})
  .use(ctx)
  .post(
    "/blog",
    async ({ body: { data, fields }, user, set, drizzle }) => {
      //   if (!user) {
      //     set.status = 401;
      //     return {
      //       message: "User not found",
      //     };
      //   }
      //   if (!user.permissions.includes("blog.add")) {
      //     set.status = 401;
      //     return {
      //       message: "You don't have permissions",
      //     };
      //   }
      let selectFields = {};
      if (fields) {
        selectFields = parseSelectFields(fields, blog, {});
      } else {
        selectFields = {
          id: blog.id,
        };
      }

      const article = await drizzle
        .insert(blog)
        .values(data)
        .returning(selectFields);

      return {
        data: article[0],
      };
    },
    {
      body: t.Object({
        data: t.Object({
          title: t.String(),
          content: t.String(),
          active: t.BooleanString(),
        }),
        fields: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .get(
    "/blog",
    async ({
      query: { limit, offset, sort, filters, fields },
      user,
      set,
      drizzle,
    }) => {
      //   if (!user) {
      //     set.status = 401;
      //     return {
      //       message: "User not found",
      //     };
      //   }
      //   if (!user.permissions.includes("blog.list")) {
      //     set.status = 401;
      //     return {
      //       message: "You don't have permissions",
      //     };
      //   }
      let selectFields: SelectedFields = {};
      if (fields) {
        selectFields = parseSelectFields(fields, blog, {});
      }
      let whereClause: (SQLWrapper | undefined)[] = [];
      if (filters) {
        whereClause = parseFilterFields(filters, blog, {});
      }
      const articlesCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(blog)
        .where(and(...whereClause))
        .execute();
      const articlesList = (await drizzle
        .select(selectFields)
        .from(blog)
        .where(and(...whereClause))
        .limit(+limit)
        .offset(+offset)
        .execute()) as InferSelectModel<typeof blog>[];
      return {
        total: articlesCount[0].count,
        data: articlesList,
      };
    },
    {
      query: t.Object({
        limit: t.Numeric(),
        offset: t.Numeric(),
        sort: t.Optional(t.String()),
        filters: t.Optional(t.String()),
        fields: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/blog/:id",
    async ({ params: { id }, user, set, drizzle }) => {
      //   if (!user) {
      //     set.status = 401;
      //     return {
      //       message: "User not found",
      //     };
      //   }
      //   if (!user.permissions.includes("blog.one")) {
      //     set.status = 401;
      //     return {
      //       message: "You don't have permissions",
      //     };
      //   }
      const article = await drizzle
        .select()
        .from(blog)
        .where(eq(blog.id, id))
        .execute();

      return article[0];
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  //   .put(
  //     "/blog/:id",
  //     async ({ params: { id }, body: { data }, user, set, drizzle }) => {
  //       //   if (!user) {
  //       //     set.status = 401;
  //       //     return {
  //       //       message: "User not found",
  //       //     };
  //       //   }
  //       //   if (!user.permissions.includes("blog.edit")) {
  //       //     set.status = 401;
  //       //     return {
  //       //       message: "You don't have permissions",
  //       //     };
  //       //   }
  //       const content = await drizzle
  //         .update(blog)
  //         .set(data)
  //         .where(eq(blog.id, id))
  //         .execute();
  //       return {
  //         data: content[0],
  //       };
  //     },
  //     {
  //       params: t.Object({
  //         id: t.String(),
  //       }),
  //       body: t.Object({
  //         data: t.Object({
  //           title: t.String(),
  //           content: t.String(),
  //           published_at: t.String(),
  //         }),
  //       }),
  //     }
  //   )
  .delete(
    "/blog/:id",
    async ({ params: { id }, user, set, drizzle }) => {
      //   if (!user) {
      //     set.status = 401;
      //     return {
      //       message: "User not found",
      //     };
      //   }
      //   if (!user.permissions.includes("blog.delete")) {
      //     set.status = 401;
      //     return {
      //       message: "You don't have permissions",
      //     };
      //   }
      await drizzle.delete(blog).where(eq(blog.id, id)).execute();
      return {
        message: "Blog deleted",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
