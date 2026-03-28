import { requireAdmin } from "@/lib/auth-helpers"

export const metadata = { title: "Manage Leagues — BBQ" }

export default async function AdminReportsPage() {
  await requireAdmin()

  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Reports</h1>
    </div>
  )
}
