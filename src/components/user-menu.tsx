"use client"

import { UserButton } from "@clerk/nextjs"

export type UserMenuLeague = {
  id: string
  leagueName: string
  clerkOrgId: string
}

export function UserMenu() {
  return (
    <div className="bbq-user-btn mt-1">
      <UserButton
        appearance={{
          elements: {
            userPreviewSecondaryIdentifier: { display: "none" },
            userButtonPopoverCard: {
              width: "270px", // Custom width
              backgroundImage: "None",
            },
          },
        }}
      />
    </div>
  )
}
