"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
    const { data: session, status } = useSession();
    const sp = useSearchParams();
    const error = sp.get("error");
    const router = useRouter();

    // If already signed in, push them to dashboard
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="rounded-xl border bg-white px-6 py-4 text-sm text-gray-600 shadow">
                    Loading…
                </div>
            </main>
        );
    }

    // While the redirect is happening, show a lightweight message
    if (status === "authenticated") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="rounded-xl border bg-white px-6 py-4 text-sm text-gray-600 shadow">
                    Redirecting to your dashboard…
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
                    <p className="mt-1 text-sm text-gray-500">Choose a provider to continue.</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {friendlyAuthError(error)}
                    </div>
                )}

                <div className="grid gap-3">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <Link href="/" className="hover:underline">Back to Home</Link>
                </div>
            </div>
        </main>
    );
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" role="img" focusable="false">
            <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6a6 6 0 110-12c1.7 0 2.9.7 3.6 1.3l2.4-2.4C16.7 2.7 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.6-4.8 8.9-9.1H12z"
            />
        </svg>
    );
}

function friendlyAuthError(code: string) {
    switch (code) {
        case "OAuthSignin":
        case "OAuthCallback":
            return "Couldn’t complete Google sign-in. Please try again.";
        case "AccessDenied":
            return "Access was denied. Please use an allowed account.";
        case "Configuration":
            return "Auth configuration issue. Check your env keys.";
        case "OAuthAccountNotLinked":
            return "Account not linked. Try another provider or contact support.";
        case "OAuthCreateAccount":
            return "Couldn’t create an account in the database. Check migrations.";
        default:
            return "Something went wrong. Please try again.";
    }
}
