import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Button,
} from "@nextui-org/react";
import Link from "next/link";

export const CardComponent = () => {
  return (
    <div className="flex-wrap gap-4 mt-4 grid grid-cols-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <Link href={`/blog/${index}`} key={index}>
          <Card className="py-4">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <p className="text-tiny uppercase font-bold">Daily Mix</p>
              <small className="text-default-500">12 Tracks</small>
              <h4 className="font-bold text-large">Frontend Radio</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
              <Image
                alt="Card background"
                className="object-cover rounded-xl"
                src="https://nextui.org/images/hero-card-complete.jpeg"
                width={400}
              />
            </CardBody>
            <CardFooter className="flex items-center justify-between">
              <div className="text-default-500">Iyul 05, 2024</div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};
