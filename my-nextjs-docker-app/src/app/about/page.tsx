export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">About Us</h1>
      <div className="max-w-2xl text-center">
        <p className="mb-4">
          We are a forward-thinking team dedicated to building high-quality web
          applications using the latest technologies like Next.js, TypeScript,
          and Docker.
        </p>
        <p className="mb-6">
          Our mission is to create scalable, maintainable, and user-friendly
          applications that solve real-world problems.
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Our Tech Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Frontend</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Next.js for server-side rendering and routing</li>
              <li>TypeScript for type safety</li>
              <li>TailwindCSS for styling</li>
              <li>React for component-based architecture</li>
            </ul>
          </div>

          <div className="border p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Backend &amp; DevOps</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Node.js for server-side logic</li>
              <li>Docker for containerization</li>
              <li>Docker Compose for multi-container applications</li>
              <li>CI/CD pipelines for automated deployment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
