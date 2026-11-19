import { render, screen } from "@testing-library/react";

import { NAV_ITEMS, isNavItemActive } from "@/components/nav/nav-items";
import { SiteNav } from "@/components/nav/site-nav";

let mockPathname: string | null = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("isNavItemActive", () => {
  it("matches home only on the exact root path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/logbook")).toBe(false);
  });

  it("matches a section and its nested routes", () => {
    expect(isNavItemActive("/logbook", "/logbook")).toBe(true);
    expect(isNavItemActive("/logbook", "/logbook/2024")).toBe(true);
  });

  it("does not match look-alike prefixes", () => {
    expect(isNavItemActive("/archives", "/archivesx")).toBe(false);
  });

  it("is inactive when the pathname is unknown", () => {
    expect(isNavItemActive("/", null)).toBe(false);
  });
});

describe("SiteNav", () => {
  it("links to every main section", () => {
    mockPathname = "/";
    render(<SiteNav />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("marks only the current section with aria-current", () => {
    mockPathname = "/diagnostics";
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Diagnostics" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
