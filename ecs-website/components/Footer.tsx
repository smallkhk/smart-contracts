import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-auto py-8" style={{ borderColor: "#2a2a2a", background: "#0d0d0d" }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-black text-black text-xs"
            style={{ background: "linear-gradient(135deg, #f5a623, #ff6b35)" }}
          >
            ECS
          </div>
          <span className="text-sm text-gray-500">Elite Community Scrims · COD Mobile BR</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/scrims" className="hover:text-white transition-colors">Scrims</Link>
          <Link href="/results" className="hover:text-white transition-colors">Results</Link>
          <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
          <Link href="/register" className="hover:text-white transition-colors">Register</Link>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} ECS. All rights reserved.</p>
      </div>
    </footer>
  );
}
