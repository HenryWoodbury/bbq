"use client";
import { useEffect } from "react";
import { useOrganization, useClerk } from "@clerk/nextjs";

export function OrgSync({ clerkOrgId }: { clerkOrgId: string }) {
  const { organization, isLoaded } = useOrganization();
  const { setActive } = useClerk();

  useEffect(() => {
    if (isLoaded && organization?.id !== clerkOrgId) {
      setActive({ organization: clerkOrgId }).catch(() => {});
    }
  }, [isLoaded, organization?.id, clerkOrgId, setActive]);

  return null;
}
