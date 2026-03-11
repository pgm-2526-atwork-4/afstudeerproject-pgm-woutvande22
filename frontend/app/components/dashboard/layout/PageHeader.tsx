interface PageHeaderProps {
  title: string;
  description: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
  </div>
);