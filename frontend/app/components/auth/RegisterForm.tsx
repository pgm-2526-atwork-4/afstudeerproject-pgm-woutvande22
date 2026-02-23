"use client";

import Link from "next/link";
import { FormInput } from "../ui/FormInput";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";

export const RegisterForm = () => (
  <section className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
    <div className="w-full max-w-md">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign up to start organizing your collections
        </p>
      </header>

      <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="firstName"
            label="First name"
            placeholder="John"
          />
          <FormInput
            id="lastName"
            label="Last name"
            placeholder="Doe"
          />
        </div>

        <FormInput
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
        />

        <PasswordInput
          id="password"
          label="Password"
          placeholder="Create a password"
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Confirm your password"
        />

        <Button type="submit">Create Account</Button>
      </form>

      <footer className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
          Sign in
        </Link>
      </footer>
    </div>
  </section>
);
