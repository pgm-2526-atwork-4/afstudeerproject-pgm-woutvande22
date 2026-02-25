export default function MoodboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {children}
    </div>
  );
}
