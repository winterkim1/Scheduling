import { AppLink } from "@/components/app-link";

export default function NotFound() {
  return (
    <div className="p-8 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground mb-6">
        요청하신 페이지가 없거나 이동되었을 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <AppLink
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          대시보드로 이동
        </AppLink>
        <AppLink
          href="/meetings"
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          회의 목록으로
        </AppLink>
      </div>
    </div>
  );
}
