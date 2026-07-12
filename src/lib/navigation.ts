export function staticHref(path: string): string {
  if (path.includes("?")) {
    const [base, query] = path.split("?");
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return `${normalized}?${query}`;
  }
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export function navigateTo(path: string) {
  window.location.assign(staticHref(path));
}
