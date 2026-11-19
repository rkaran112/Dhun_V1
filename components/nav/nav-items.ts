export type NavItem = {
  href: string;
  label: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/mainframe", label: "Mainframe" },
  { href: "/logbook", label: "Logbook" },
  { href: "/archives", label: "Archives" },
  { href: "/diagnostics", label: "Diagnostics" },
];

/**
 * Whether a nav link should be highlighted for the current pathname.
 * "/" only matches exactly; other links also match their nested routes
 * (e.g. "/logbook/2024" highlights "Logbook") but not look-alike prefixes
 * such as "/logbooks".
 */
export function isNavItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
