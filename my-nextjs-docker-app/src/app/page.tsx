export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to Next.js with Docker
      </h1>
      <div className="max-w-2xl text-center">
        <p className="mb-4">
          This is a sample application demonstrating Next.js with TypeScript
          running in Docker containers.
        </p>
        <p>
          Use the navigation above to explore different pages and see how
          routing works in Next.js.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">File-Based Routing</h2>
          <p>
            Next.js uses the file system to create routes, making it intuitive
            to build complex applications.
          </p>
        </div>

        <div className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">TypeScript Support</h2>
          <p>
            Built-in TypeScript support provides type safety and better
            developer experience.
          </p>
        </div>

        <div className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">Docker Integration</h2>
          <p>
            Containerized development and production environments ensure
            consistency across different platforms.
          </p>
        </div>
      </div>
    </div>
  );
}
