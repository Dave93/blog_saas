import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-4xl">
      <Link href="/blog">
        <Button color="primary" variant="light">
          Back to blog
        </Button>
      </Link>
    </div>
  );
}
