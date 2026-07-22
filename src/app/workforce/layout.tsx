import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workforce Sign In",
  description: "Secure enterprise access for WAAMTO Workforce.",
  robots: { index: false, follow: false },
};

export default function WorkforceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
