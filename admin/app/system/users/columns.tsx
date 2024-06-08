"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2Icon } from "lucide-react";
import { Button } from "@components/ui/button";
import UsersFormSheet from "@components/forms/users/sheet";

import { Badge } from "@components/ui/badge";
import { users } from "@backend/../drizzle/schema";
import { InferSelectModel } from "drizzle-orm";

export const usersColumns: ColumnDef<InferSelectModel<typeof users>>[] = [
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;

      return (
        <Badge variant={record.active === true ? "success" : "destructive"}>
          {record.active === true ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "login",
    header: "Login",
  },
  {
    accessorKey: "first_name",
    header: "Name",
  },
  {
    accessorKey: "last_name",
    header: "Last name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original;

      return (
        <div className="flex items-center space-x-2">
          <UsersFormSheet recordId={record.id}>
            <Button variant="outline" size="sm">
              <Edit2Icon className="h-4 w-4" />
            </Button>
          </UsersFormSheet>
        </div>
      );
    },
  },
];
