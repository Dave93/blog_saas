import { apiClient } from "@admin/utils/eden";
import { InferSelectModel } from "drizzle-orm";
import { blog } from "@backend/../drizzle/schema";

export const get = async ({
  limit,
  offset,
  token,
}: {
  limit: number;
  offset: number;
  token: string;
}) => {
  const { data } = await apiClient.api.blog.get({
    query: {
      limit,
      offset,
      fields: "id,active,title,published_at,viewed_count,created_by",
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (data && "data" in data && "data") {
    return {
      data: data.data,
      total: data.total,
    };
  } else {
    return {
      data: [],
      total: 0,
    };
  }
};
