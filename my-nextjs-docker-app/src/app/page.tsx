import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center mr-4">
            <Image
              src="/android-chrome-512x512.png"
              alt="Gear Icon"
              width={64}
              height={64}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Welcome to Next.js with Docker</h1>
        </div>

        <div className="mb-8">
          <p className="mb-4">
            This is a sample application demonstrating Next.js with TypeScript
            running in Docker containers.
          </p>
          <p>
            Use the navigation above to explore different pages and see how
            routing works in Next.js.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 mr-2 flex items-center justify-center">
                <Image
                  src="/android-chrome-512x512.png"
                  alt="File-Based Routing"
                  width={24}
                  height={24}
                  priority
                />
              </div>
              <h2 className="text-xl font-semibold">File-Based Routing</h2>
            </div>
            <p>
              Next.js uses the file system to create routes, making it intuitive
              to build complex applications.
            </p>
          </div>

          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 mr-2 flex items-center justify-center">
                <Image
                  src="/android-chrome-512x512.png"
                  alt="TypeScript Support"
                  width={24}
                  height={24}
                  priority
                />
              </div>
              <h2 className="text-xl font-semibold">TypeScript Support</h2>
            </div>
            <p>
              Built-in TypeScript support provides type safety and better
              developer experience.
            </p>
          </div>

          <div className="border p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 mr-2 flex items-center justify-center">
                <Image
                  src="/android-chrome-512x512.png"
                  alt="Docker Integration"
                  width={24}
                  height={24}
                  priority
                />
              </div>
              <h2 className="text-xl font-semibold">Docker Integration</h2>
            </div>
            <p>
              Containerized development and production environments ensure
              consistency across different platforms.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex gap-8 items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js"
          target="_blank"
          rel="noopener noreferrer"
        >
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
