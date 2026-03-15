import { requireAdmin } from "@/lib/auth-helpers"

export const metadata = { title: "Manage Leagues — BBQ" }

export default async function AdminReportsPage() {
  await requireAdmin()

  return (
    <div className="page-layout">
      <section>
        <h1 className="page-title">Reports</h1>
      </section>
    </div>
  )
}
