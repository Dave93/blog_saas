"use client";

import { DataTable } from "@admin/components/data-table/data-table";
import { blogColumns } from "./columns";
import UsersFormSheet from "@components/forms/users/sheet";
import { Button } from "@components/ui/button";
import { Plus } from "lucide-react";
import { blog } from "@backend/../drizzle/schema";
import { InferSelectModel } from "drizzle-orm";
import { get } from "./queries";

export default function Blog() {
  return (
    <div className="h-screen">
      <div className="flex justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Articles List</h2>
        <div className="flex items-center space-x-2">
          <UsersFormSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create article
            </Button>
          </UsersFormSheet>
        </div>
      </div>
      <div className="py-10 ">
        <DataTable<InferSelectModel<typeof blog>>
          columns={blogColumns}
          queryKeyName="blog"
          getQueryData={get}
        />
      </div>
    </div>
  );
}
