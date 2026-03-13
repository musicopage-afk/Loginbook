"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MouseEvent, useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-3.5a1 1 0 0 1-1-1V15a2 2 0 0 0-4 0v4a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function ShellSidebar({
  items,
  children
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setOpen(false);
  }, [pathname]);

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (href === pathname) {
      setOpen(false);
      return;
    }

    setOpen(false);
  }

  return (
    <div className={`shell-layout ${open ? "is-sidebar-open" : "is-sidebar-closed"}`}>
      {open ? <button className="shell-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
      <aside className={`shell-sidebar ${open ? "is-open" : "is-closed"}`} aria-label="Primary navigation">
        <div className="shell-sidebar-header">
          <span className="shell-sidebar-title">Navigation</span>
          {open ? (
            <button className="shell-sidebar-toggle" type="button" aria-label="Collapse navigation" onClick={() => setOpen(false)}>
              <ArrowIcon />
            </button>
          ) : null}
        </div>
        <nav className="shell-sidebar-nav">
          <Link className="shell-home-link" href="/" onClick={(event) => handleNavigate(event, "/")}>
            <HomeIcon />
            <span>Home</span>
          </Link>
          {items.map((item) => (
            <Link key={item.href} className="shell-sidebar-link" href={item.href} onClick={(event) => handleNavigate(event, item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="shell-main">
        {!open ? (
          <button className="shell-open-button" type="button" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <MenuIcon />
          </button>
        ) : null}
        <div className={`shell-content ${open ? "is-blurred" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
