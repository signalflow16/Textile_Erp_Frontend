"use client";

export function DocumentFormLayout({
  main,
  side,
  footer
}: {
  main: React.ReactNode;
  side: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="document-layout">
      <div className="document-layout-main">{main}</div>
      <div className="document-layout-support">{side}</div>
      <div className="document-layout-footer">{footer}</div>
    </div>
  );
}
