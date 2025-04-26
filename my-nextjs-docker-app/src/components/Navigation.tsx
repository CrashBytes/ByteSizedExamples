import React from "react";
import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Next.js Docker
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-blue-300 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-300 transition-colors">
            About
          </Link>
          <Link
            href="/contact"
            className="hover:text-blue-300 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
