import Link from "next/link";
import { navItems } from "@/lib/navigation";

export function NavLinks() {
  return (
    <nav aria-label="Primary navigation" className="hidden items-center gap-2 md:flex">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full px-3 py-2 text-sm font-medium text-slate-200 transition-colors duration-150 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
