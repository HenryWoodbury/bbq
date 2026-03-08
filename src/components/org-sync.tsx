"use client"
import { useClerk, useOrganization } from "@clerk/nextjs"
import { useEffect } from "react"

export function OrgSync({ clerkOrgId }: { clerkOrgId: string }) {
  const { organization, isLoaded } = useOrganization()
  const { setActive } = useClerk()

  useEffect(() => {
    if (isLoaded && organization?.id !== clerkOrgId) {
      setActive({ organization: clerkOrgId }).catch(() => {})
    }
  }, [isLoaded, organization?.id, clerkOrgId, setActive])

  return null
}
