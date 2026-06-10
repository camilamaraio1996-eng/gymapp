export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dot-grid min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
