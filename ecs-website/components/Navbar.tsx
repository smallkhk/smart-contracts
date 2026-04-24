"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { isStaff } from "@/lib/roles";
import { Role } from "@prisma/client";

const navLinks = [
  { href: "/scrims", label: "Scrims" },
  { href: "/results", label: "Results" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/teams", label: "Teams" },
  { href: "/banned", label: "Banned", red: true },
  { href: "/register", label: "Register Team" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const userRole = session?.user?.role as Role | undefined;
  const staff = userRole ? isStaff(userRole) : false;

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "#0d0d0d", borderColor: "#2a2a2a" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded flex items-center justify-center font-black text-black text-sm" style={{ background: "linear-gradient(135deg,#f5a623,#ff6b35)" }}>ECS</div>
          <div className="hidden sm:block">
            <div className="font-black text-white text-sm tracking-widest">ELITE COMMUNITY</div>
            <div className="text-xs tracking-widest" style={{ color: "#f5a623" }}>SCRIMS · CODM BR</div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-5 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors"
              style={{ color: link.red ? "#ef5350" : "#9ca3af" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = link.red ? "#ff6b6b" : "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = link.red ? "#ef5350" : "#9ca3af")}>
              {link.label}
            </Link>
          ))}
          {staff && <Link href="/dashboard" className="font-bold" style={{ color: "#f5a623" }}>Dashboard</Link>}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              {session.user.image && <Image src={session.user.image} alt={session.user.name ?? "User"} width={32} height={32} className="rounded-full" />}
              <span className="text-sm text-gray-400 max-w-[120px] truncate">{session.user.discordTag ?? session.user.name}</span>
              <button onClick={() => signOut()} className="btn-ghost text-sm">Sign Out</button>
            </div>
          ) : (
            <button onClick={() => signIn("discord")} className="btn-primary text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
              Login with Discord
            </button>
          )}
        </div>

        <button className="lg:hidden text-gray-300 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 flex flex-col gap-2 text-sm border-t" style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 border-b"
              style={{ color: link.red ? "#ef5350" : "#9ca3af", borderColor: "#1a1a1a" }}
              onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          {staff && <Link href="/dashboard" style={{ color: "#f5a623" }} className="py-2 font-bold" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          <div className="pt-2">
            {session ? <button onClick={() => signOut()} className="btn-ghost text-left w-full">Sign Out</button>
              : <button onClick={() => signIn("discord")} className="btn-primary text-center w-full py-2">Login with Discord</button>}
          </div>
        </div>
      )}
    </nav>
  );
}
