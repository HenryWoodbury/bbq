interface StatCardProps {
  label: string
  value: string | number
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="">{label}</p>
      <p className="mt-1 stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  )
}
