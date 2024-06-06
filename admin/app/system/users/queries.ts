import { apiClient } from "@admin/utils/eden";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@backend/../drizzle/schema";

export const get = async ({
  limit,
  offset,
  token,
}: {
  limit: number;
  offset: number;
  token: string;
}) => {
  const { data } = await apiClient.api.users.get({
    query: {
      limit,
      offset,
      fields: "id,login,status,first_name,last_name",
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (data && "data" in data && "data") {
    return {
      data: data.data!.data!,
      total: data.data!.total!,
    };
  } else {
    return {
      data: [],
      total: 0,
    };
  }
};

export const create = async ({
  newTodo,
}: {
  newTodo: {
    dataForMutation: {
      active: boolean;
      sort: number;
      name: string;
      name_uz: string | undefined;
      description: string;
      description_uz: string | undefined;
      city_id: number | undefined;
      assets: File[] | undefined;
    };
    token: string;
  };
}) => {
  console.log("new todo", newTodo);
  return await apiClient.api.news.post(newTodo.dataForMutation, {
    headers: {
      Authorization: `Bearer ${newTodo.token}`,
    },
  });
};

export const update = async ({
  newTodo,
}: {
  newTodo: {
    dataForMutation: {
      active: boolean | undefined;
      sort: number | undefined;
      name: string | undefined;
      name_uz: string | undefined;
      description: string | undefined;
      description_uz: string | undefined;
      city_id: number | undefined;
      assets: File[] | undefined;
    };
    id: number;
    token: string;
  };
}) => {
  return await apiClient.api
    .news({ id: newTodo.id })
    .put(newTodo.dataForMutation, {
      headers: {
        Authorization: `Bearer ${newTodo.token}`,
      },
    });
};

export const getNewsById = async ({
  id,
  token,
}: {
  id: number;
  token: string;
}) => {
  return await apiClient.api.news({ id }).get({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
