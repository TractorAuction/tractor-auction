// The (auth) group adds no path segment of its own, so there is no generated
// LayoutProps route to key off — children is typed directly. The site header
// above already carries the logo, so the form needs no second brand mark.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
      {children}
    </main>
  )
}
