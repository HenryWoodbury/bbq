"use client";

import { UserButton } from "@clerk/nextjs";
import { ShieldIcon } from "lucide-react";

export type UserMenuLeague = {
  id: string;
  leagueName: string;
  clerkOrgId: string;
};

type Props = {
  isAdmin: boolean;
};

export function UserMenu({ isAdmin }: Props) {
  return (
    <div className="bbq-user-btn">
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            userPreviewSecondaryIdentifier: { display: "none" },
          },
        }}
      >
        <UserButton.MenuItems>
          {isAdmin && (
            <UserButton.Link
              label="Admin"
              href="/admin"
              labelIcon={<ShieldIcon size={16} />}
            />
          )}
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}
