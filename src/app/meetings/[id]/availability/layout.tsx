export function generateStaticParams() {
  return [
    { id: "meeting-1" },
    { id: "meeting-2" },
    { id: "meeting-3" },
    { id: "meeting-4" },
    { id: "meeting-5" },
    { id: "meeting-6" },
    { id: "meeting-7" },
  ];
}

export default function AvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
