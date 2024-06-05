import { useToast } from "@admin/components/ui/use-toast";
import { Button } from "@components/ui/button";
import { useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { useCallback, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { users } from "@backend/../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import useToken from "@admin/store/get-token";
import { apiClient } from "@admin/utils/eden";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Select, SelectItem, SelectedItems } from "@nextui-org/select";
import { Selection } from "@react-types/shared";
import { Switch } from "@admin/components/ui/switch";

export default function UsersForm({
  setOpen,
  recordId,
}: {
  setOpen: (open: boolean) => void;
  recordId?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const token = useToken();
  const { toast } = useToast();
  const [changedRoleId, setChangedRoleId] = useState<string | null>(null);
  const [changedTerminalId, setChangedTerminalId] = useState<Selection>(
    new Set([])
  );
  const [changedStoreId, setChangedStoreId] = useState<Selection>(new Set([]));
  const closeForm = () => {
    form.reset();
    setOpen(false);
  };

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
    mutationFn: (newTodo: InferInsertModel<typeof users>) => {
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

  const form = useForm<InferInsertModel<typeof users>>({
    defaultValues: {
      status: record?.data?.status || "active",
      login: record?.data?.login || "",
      password: "",
      first_name: record?.data?.first_name || "",
      last_name: record?.data?.last_name || "",
    },
    onSubmit: async ({ value }) => {
      if (recordId) {
        updateMutation.mutate({ data: value, id: recordId });
      } else {
        createMutation.mutate(value);
      }
    },
  });

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
    [changedRoleId, userRoleId, recordId, changedTerminalId, changedStoreId]
  );

  const isLoading = useMemo(() => {
    return (
      createMutation.isPending || updateMutation.isPending || isRolesLoading
    );
  }, [createMutation.isPending, updateMutation.isPending, isRolesLoading]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-2 grid grid-cols-1 gap-4 sm:grid-cols-2 p-6"
    >
      <div className="space-y-2 col-start-1 col-end-3">
        <div>
          <Label>Статус</Label>
        </div>
        <form.Field name="active">
          {(field) => {
            return (
              <Switch
              checked={field.getValue()}
              onCheckedChange={(e)=> field.setValue(e)}
              />
            );
          }}
        </form.Field>
      </div>
      <div className="space-y-2">
        <div>
          <Label>Логин</Label>
        </div>
        <form.Field name="login">
          {(field) => {
            return (
              <>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.getValue() ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    // @ts-ignore
                    field.handleChange(e.target.value);
                  }}
                />
              </>
            );
          }}
        </form.Field>
      </div>
      <div className="space-y-2">
        <div>
          <Label>Пароль</Label>
        </div>
        <form.Field name="password">
          {(field) => {
            return (
              <>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.getValue() ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    // @ts-ignore
                    field.handleChange(e.target.value);
                  }}
                />
              </>
            );
          }}
        </form.Field>
      </div>
     

      <div className="space-y-2">
        <div>
          <Label>Имя</Label>
        </div>
        <form.Field name="first_name">
          {(field) => {
            return (
              <>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.getValue() ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    // @ts-ignore
                    field.handleChange(e.target.value);
                  }}
                />
              </>
            );
          }}
        </form.Field>
      </div>
      <div className="space-y-2">
        <div>
          <Label>Фамилия</Label>
        </div>
        <form.Field name="last_name">
          {(field) => {
            return (
              <>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.getValue() ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    // @ts-ignore
                    field.handleChange(e.target.value);
                  }}
                />
              </>
            );
          }}
        </form.Field>
      </div>
      <div className="space-y-2 col-span-2">
        <div>
          <Label>Роль</Label>
        </div>
        <Select
          label="Роль"
          placeholder="Выберите роль"
          selectedKeys={userRoleId ? [userRoleId] : []}
          className=""
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            // @ts-ignore
            setChangedRoleId(e.target.value);
          }}
          popoverProps={{
            portalContainer: formRef.current!,
            offset: 0,
            containerPadding: 0,
          }}
        >
          {Array.isArray(rolesData) ? (
            rolesData?.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem key="0" value="0">
              Загрузка...
            </SelectItem>
          )}
        </Select>
      </div>
      <div className="pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </div>
    </form>
  );
}
