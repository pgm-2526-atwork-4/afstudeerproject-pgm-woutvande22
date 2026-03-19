import { BackButton } from "@/app/components/ui/BackButton";

interface AuthSidePanelProps {
  title: string;
  description: string;
}

export const AuthSidePanel = ({ title, description }: AuthSidePanelProps) => (
<aside className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-brand-blue to-sky-100 items-center justify-center relative">
  <div className="absolute left-8 top-8">
    <BackButton href="/" label="Back" />
  </div>
  
  <div className="text-center px-12">
    <h2 className="text-5xl font-bold text-gray-900">{title}</h2>
    <p className="mt-4 text-gray-600 text-sm">{description}</p>
  </div>
</aside>

);
