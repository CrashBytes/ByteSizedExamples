// App.tsx
import React from "react";
import Home from "./Home";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">iTunes Search App</h1>
          <p className="text-blue-100">Find your favorite artists and albums</p>
        </div>
      </header>

      <main>
        <Home />
      </main>

      <footer className="bg-gray-100 p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          <p>
            iTunes Search Interview Exercise &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
