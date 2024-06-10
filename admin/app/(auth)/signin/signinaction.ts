
"use server";
import { signIn } from "@admin/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export const action = async (formData: FormData) => {

    try {
        var signInData: {
            [key: string]: FormDataEntryValue;
        } = {};
        formData.forEach((value, key) => signInData[key] = value);
        await signIn("credentials", {
            ...signInData,
            redirect: false,
        });
    } catch (error) {
        console.log('auth error', error);
        if (error instanceof AuthError)
            // Handle auth errors
            throw error; // Rethrow all other errors
    }

    redirect("/");
}