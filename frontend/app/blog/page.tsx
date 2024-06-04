import React from "react";
import { title } from "@/components/primitives";
import { CardComponent } from "@/components/card";


export default function BlogPage() {
  return (
    <div>
      <h1 className={title()}>Blog</h1>
      <CardComponent />
    </div>
  );
}
