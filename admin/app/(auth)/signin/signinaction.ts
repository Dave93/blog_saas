
"use server";
import { signIn } from "@admin/auth";
import { AuthError } from "next-auth";

export const action = async (formData: FormData) => {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        console.log('auth error', error);
        if (error instanceof AuthError)
            // Handle auth errors
            throw error; // Rethrow all other errors
    }
}