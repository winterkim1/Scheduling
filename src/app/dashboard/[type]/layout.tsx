import { DASHBOARD_LIST_TYPES } from "@/lib/dashboard-filters";

export function generateStaticParams() {
  return DASHBOARD_LIST_TYPES.map((type) => ({ type }));
}

export default function DashboardDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
