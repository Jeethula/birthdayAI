import Link from "next/link";
import { Gift, Home, Calendar, User, Settings, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-3 px-6 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <Gift className="w-5 h-5 text-blue-300" />
          </div>
          <h1 className="text-xl font-bold">
            Card<span className="text-blue-300">Studio</span>
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="flex items-center hover:text-blue-300 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            href="/templates"
            className="flex items-center hover:text-blue-300 transition-colors"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium">Templates</span>
          </Link>

          <Link
            href="/people"
            className="flex items-center hover:text-blue-300 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">People</span>
          </Link>

            <Link
            href="/ai"
            className="flex items-center hover:text-blue-300 transition-colors"
            >
            <Sparkles className="w-4 h-4 mr-2 text-blue-300 animate-pulse" />
            <span className="font-medium">Generate with AI</span>
            </Link>
        </div>
      </div>
    </nav>
  );
}
