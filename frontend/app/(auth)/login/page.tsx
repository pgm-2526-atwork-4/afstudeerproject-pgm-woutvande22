import { AuthSidePanel } from "@/app/components/auth/AuthSidePanel";
import { LoginForm } from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <AuthSidePanel
        title="Collections"
        description="Organize and manage your image collections"
      />
      <LoginForm />
    </>
  );
}
