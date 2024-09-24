"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2Icon } from "lucide-react";
import { Button } from "@components/ui/button";
// import UsersFormSheet from "@components/forms/users/sheet";

import { Badge } from "@components/ui/badge";
import { blog } from "@backend/../drizzle/schema";
import { InferSelectModel } from "drizzle-orm";

export const blogColumns: ColumnDef<InferSelectModel<typeof blog>>[] = [
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
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "published_at",
    header: "Published time",
  },
  {
    accessorKey: "viewed_count",
    header: "Viewed count",
  },
  {
    accessorKey: "created_by",
    header: "Created by",
  },
  //   {
  //     id: "actions",
  //     cell: ({ row }) => {
  //       const record = row.original;

  //       return (
  //         <div className="flex items-center space-x-2">
  //           <UsersFormSheet recordId={record.id}>
  //             <Button variant="outline" size="sm">
  //               <Edit2Icon className="h-4 w-4" />
  //             </Button>
  //           </UsersFormSheet>
  //         </div>
  //       );
  //     },
  //   },
];
