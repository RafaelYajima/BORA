import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -right-32 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex rounded-2xl bg-surface px-5 py-3 shadow-lg shadow-primary/10">
            <Logo />
          </div>
          <p className="text-sm font-medium text-muted">Organize sua turma. O resto a gente cuida.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
