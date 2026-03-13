"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = {
  href?: string;
  label: string;
  current?: boolean;
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 19.5V16a2 2 0 0 0-4 0v3.5A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === "/") {
    return [{ label: "Home", current: true }];
  }

  if (pathname === "/login") {
    return [
      { href: "/", label: "Home" },
      { label: "Login", current: true }
    ];
  }

  if (pathname === "/audit") {
    return [
      { href: "/", label: "Home" },
      { label: "Audit", current: true }
    ];
  }

  if (pathname === "/logbooks" || /^\/logbooks\/[^/]+$/.test(pathname)) {
    return [
      { href: "/", label: "Home" },
      { label: "Log Book", current: true }
    ];
  }

  if (/^\/logbooks\/[^/]+\/entries\/new$/.test(pathname)) {
    return [
      { href: "/", label: "Home" },
      { href: "/logbooks", label: "Log Book" },
      { label: "Create Log", current: true }
    ];
  }

  if (/^\/entries\/[^/]+\/edit$/.test(pathname)) {
    return [
      { href: "/", label: "Home" },
      { href: "/logbooks", label: "Log Book" },
      { label: "Edit Log", current: true }
    ];
  }

  if (/^\/entries\/[^/]+$/.test(pathname)) {
    return [
      { href: "/", label: "Home" },
      { href: "/logbooks", label: "Log Book" },
      { label: "Log Details", current: true }
    ];
  }

  const segments = pathname.split("/").filter(Boolean);

  return [
    { href: "/", label: "Home" },
    ...segments.map((segment, index) => ({
      href: index === segments.length - 1 ? undefined : `/${segments.slice(0, index + 1).join("/")}`,
      label: segment.replace(/[-_]/g, " "),
      current: index === segments.length - 1
    }))
  ];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {breadcrumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`}>
            {index > 0 ? (
              <span className="breadcrumb-separator" aria-hidden="true">
                &gt;
              </span>
            ) : null}
            {crumb.current ? (
              <span className="breadcrumb-current" aria-current="page">
                {index === 0 ? <HomeIcon /> : null}
                <span>{crumb.label}</span>
              </span>
            ) : (
              <Link href={crumb.href ?? "/"} className="breadcrumb-link">
                {index === 0 ? <HomeIcon /> : null}
                <span>{crumb.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
