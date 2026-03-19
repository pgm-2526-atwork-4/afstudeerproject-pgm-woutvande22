import Link from "next/link"
import Image from "next/image";

export const Navbar = () => (
  <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/favicon-32x32.png" alt="Collections logo" width={28} height={28} />
          <span className="font-semibold text-gray-900 text-lg">Collections</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign In
        </Link>
      </nav>
);