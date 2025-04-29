// Home.tsx
import React, { useState, useEffect } from "react";
import { getArtistAlbumsByName, AlbumWithSongs } from "../networking/api";
import Albums from "../components/Albums";

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [albums, setAlbums] = useState<AlbumWithSongs[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This useEffect intentionally doesn't have debouncing
  // Candidates should identify this as an improvement opportunity
  useEffect(() => {
    const fetchAlbums = async () => {
      if (!searchTerm) {
        setAlbums([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getArtistAlbumsByName(searchTerm);
        setAlbums(result);
      } catch (err) {
        setError("Failed to fetch albums. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [searchTerm]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">iTunes Album Search</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Enter artist name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-md"
          data-testid="search-input"
        />
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <p>Loading albums...</p>
        </div>
      )}

      {error && (
        <div className="text-red-500 py-4">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && albums.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p>No albums found for "{searchTerm}"</p>
        </div>
      )}

      {albums.length > 0 && <Albums albums={albums} />}
    </div>
  );
};

export default Home;
