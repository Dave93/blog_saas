import { useToast } from "@admin/components/ui/use-toast";
import { Button } from "@components/ui/button";
import { useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { useCallback, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { users } from "@backend/../drizzle/schema";
import useToken from "@admin/store/get-token";
import { apiClient } from "@admin/utils/eden";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Select, SelectItem, SelectedItems } from "@nextui-org/select";
import { Selection } from "@react-types/shared";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@admin/components/ui/form";
import { Switch, Textarea } from "@nextui-org/react";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@radix-ui/react-select";

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
    assignRole(successData?.data);
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
    mutationFn: (newTodo: {}) => {
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
        queryKey: ["roles_cached"],
        queryFn: async () => {
          const { data } = await apiClient.api.roles.cached.get({
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

  const values = useMemo(() => {
    if (record && record.data && "id" in record.data) {
      return {
        active: record.data.active,
        login: record.data.login,
        email: record.data.email,
        password: "",
        first_name: record.data.first_name,
        last_name: record.data.last_name,
        role: userRoleId,
      };
    } else {
      return {
        active: false,
        login: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: undefined,
      };
    }
  }, [record]);

  const form = useForm({
    defaultValues: {
      active: false,
      login: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: undefined,
    },
    values,
  });

  const onSubmit = async ({ data }) => {
    if (recordId) {
      updateMutation.mutate({ data: value, id: recordId });
    } else {
      createMutation.mutate(value);
    }
  };

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

  const isLoading = useMemo(() => {
    return (
      createMutation.isPending || updateMutation.isPending || isRolesLoading
    );
  }, [createMutation.isPending, updateMutation.isPending, isRolesLoading]);

  return (
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
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Login</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
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
  );
}
