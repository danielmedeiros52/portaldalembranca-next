"use client";

// TODO: Implement dashboard layout with Next.js router and auth
// This is a stub to allow the build to pass

import type { ReactNode } from "react";

export interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <div>{children}</div>;
}
