import { AuthSidePanel } from "@/app/components/auth/AuthSidePanel";
import { RegisterForm } from "@/app/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <AuthSidePanel
        title="Collections"
        description="Organize and manage your image collections"
      />
      <RegisterForm />
    </>
  );
}
