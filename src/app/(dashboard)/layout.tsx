import { auth } from "@/lib/auth";
import { MainNav } from "@/components/main-nav";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold">Fixed Asset Manager</span>
            <MainNav isAdmin={session?.user?.role === "ADMIN"} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session?.user?.name} ({session?.user?.role})
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
