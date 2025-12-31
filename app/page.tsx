import { redirect } from "next/navigation"

export default function Home() {
  redirect("/login")
  // return (
  //   <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
  //     <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
  //     <LoginForm />
  //   </div>
  // )
}
