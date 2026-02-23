import Link from "next/link"
import PermMediaIcon from '@mui/icons-material/PermMedia';

export const Navbar = () => (
  <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <PermMediaIcon />
          <span className="font-semibold text-gray-900 text-base">ImageVault</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign In
        </Link>
      </nav>
);