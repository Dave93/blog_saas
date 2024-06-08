export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex flex-col min-h-dvh relative">
      <div className="flex items-center justify-center">
        <div
          className="bg-content1 flex h-screen items-center justify-around lg:p-8 overflow-hidden p-2 sm:p-4 w-screen"
          style={{
            backgroundImage: `url('/public/image/shapes_and_pattern.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
