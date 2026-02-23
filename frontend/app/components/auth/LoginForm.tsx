"use client";

import Link from "next/link";
import { FormInput } from "../ui/FormInput";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";

export const LoginForm = () => (
  <section className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
    <div className="w-full max-w-md">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to continue to your account
        </p>
      </header>

      <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <FormInput
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Enter your password"
        />

        <Button type="submit">Sign In</Button>
      </form>

      <footer className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sky-500 hover:text-sky-600 font-medium">
          Register
        </Link>
      </footer>
    </div>
  </section>
);
