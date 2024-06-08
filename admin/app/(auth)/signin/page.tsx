"use client";
import { signIn, auth } from "@admin/auth";
import { providerMap } from "@admin/auth.config";
import { AuthError } from "next-auth";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Button, Input } from "@nextui-org/react";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { z } from "zod";

type FormErrors = {
  email?: undefined | string[];
  password?: undefined | string[];
  strapiError?: string;
};

const initialState = {
  email: "",
  password: "",
};

const formSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 8 characters long." })
    .max(30),
});

export default function SignInPage() {
  const [data, setData] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const validatedFields = formSchema.safeParse(data);

    if (!validatedFields.success) {
      setErrors(validatedFields.error.formErrors.fieldErrors);
      setLoading(false);
    } else {
      // no zod errors
      const signInResponse = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signInResponse && !signInResponse?.ok) {
        setErrors({
          strapiError: signInResponse.error
            ? signInResponse.error
            : "Something went wrong.",
        });
        setLoading(false);
      } else {
        // handle success
        router.push(callbackUrl);
        router.refresh();
      }
    }
  }

  return (
    <Card
      isBlurred
      fullWidth
      className="border-none bg-background/60 dark:bg-default-100/50 max-w-sm backdrop-saturate-150 px-8 pb-10 pt-6"
      shadow="sm"
    >
      <form onSubmit={handleSubmit}>
        <CardHeader className="p-0">
          <div className="pb-6 text-xl">Sign in</div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your login"
              label="Login"
              name="login"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              name="password"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeOffIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible ? "text" : "password"}
            />
            <Button type="submit" className="mt-4 w-full" variant="shadow">
              Login
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
