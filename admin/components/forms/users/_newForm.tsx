import { Button } from "@admin/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@admin/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@admin/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@admin/components/ui/select";
import { Switch } from "@admin/components/ui/switch";
import { useToast } from "@admin/components/ui/use-toast";
import useToken from "@admin/store/get-token";
import { apiClient } from "@admin/utils/eden";
import { users } from "@backend/../drizzle/schema";
import { useMutation, useQueries } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export default function UsersForm({
  setOpen,
  recordId,
}: {
  setOpen: (open: boolean) => void;
  recordId?: string;
}) {
  const token = useToken();
  const { toast } = useToast();
  const [changedRoleId, setChangedRoleId] = useState<string | null>(null);

  const onAddSuccess = (actionText: string, successData: any) => {
    toast({
      title: "Success",
      description: `User ${actionText}`,
      duration: 5000,
    });
    //   assignRole(successData?.data);
  };

  const onError = (error: any) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
      duration: 5000,
    });
  };

  const createMutation = useMutation({
    mutationFn: (newTodo: {
      data: InferInsertModel<typeof users>;

      fields: string[];
    }) => {
      return apiClient.api.users.post(
        {
          data: newTodo,
          fields: [
            "id",
            "status",
            "login",
            "password",
            "first_name",
            "last_name",
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: (data) => onAddSuccess("added", data),
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: (newTodo: {
      data: InferInsertModel<typeof users>;

      id: string;
    }) => {
      return apiClient.api.users({ id: newTodo.id }).put(
        {
          data: newTodo.data,
          fields: [
            "id",
            "status",
            "login",
            "password",
            "first_name",
            "last_name",
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: (data) => onAddSuccess("updated", data),
    onError,
  });

  const assignRoleMutation = useMutation({
    mutationFn: (newTodo: { role_id: string; user_id: string }) => {
      return apiClient.api.users.assign_role.post(
        {
          ...newTodo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onError,
  });
  console.log("token", token);
  const [
    { data: record, isLoading: isRecordLoading },
    { data: rolesData, isLoading: isRolesLoading },
    { data: userRolesData, isLoading: isUserRolesLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ["one_user", recordId],
        queryFn: async () => {
          if (recordId) {
            const { data } = await apiClient.api.users({ id: recordId }).get({
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return data;
          } else {
            return null;
          }
        },
        enabled: !!recordId && !!token,
      },
      {
        enabled: !!token,
        queryKey: ["roles"],
        queryFn: async () => {
          const { data } = await apiClient.api.roles.get({
            query: {
              limit: "1000",
              offset: "0",
              fields: "id,name,code,active",
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return data;
        },
      },
      {
        enabled: !!recordId && !!token,
        queryKey: ["users_roles", recordId],
        queryFn: async () => {
          if (recordId) {
            const { data } = await apiClient.api.users_roles.get({
              query: {
                limit: "30",
                offset: "0",
                filters: JSON.stringify([
                  {
                    field: "user_id",
                    operator: "=",
                    value: recordId,
                  },
                ]),
                fields: "role_id,user_id",
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return data;
          } else {
            return null;
          }
        },
      },
    ],
  });

  console.log("roles data", rolesData);

  const values = useMemo(() => {
    if (record && record.data && "email" in record.data) {
      return {
        active: record.data.active || false,
        email: record.data.email,
        password: "",
        first_name: record.data.first_name || undefined,
        last_name: record.data.last_name || undefined,
        role: undefined,
      };
    } else {
      return {
        active: false,
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: undefined,
      };
    }
  }, [record]);

  const userRoleId = useMemo(() => {
    if (changedRoleId) {
      return changedRoleId;
    } else if (
      userRolesData &&
      userRolesData.data &&
      userRolesData.data.length > 0
    ) {
      return userRolesData.data[0].role_id;
    } else {
      return null;
    }
  }, [userRolesData, changedRoleId]);

  const form = useForm({
    defaultValues: {
      active: false,
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: undefined,
    },
    values,
  });

  const onSubmit = async ({ data }) => {
    console.log("data", data);
  };

  const assignRole = useCallback(
    async (recordData: InferSelectModel<typeof users>) => {
      let userId = recordData?.id;
      if (recordId) {
        userId = recordId;
      }
      await assignRoleMutation.mutate({
        user_id: userId,
        role_id: changedRoleId ? changedRoleId! : userRoleId!,
      });
    },
    [changedRoleId, userRoleId, recordId]
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                <div className="space-y-0.5">
                  <FormLabel>Status</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose the role" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {Array.isArray(rolesData) &&
                      rolesData.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </>
  );
}
