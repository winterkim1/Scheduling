import { staticHref } from "@/lib/navigation";
import type { ComponentProps } from "react";

type AppLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
};

export function AppLink({ href, children, ...props }: AppLinkProps) {
  return (
    <a href={staticHref(href)} {...props}>
      {children}
    </a>
  );
}
