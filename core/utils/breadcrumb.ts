export function generateBreadcrumb(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  return segments
    .map((segment) =>
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    )
    .join(" > ");
}
