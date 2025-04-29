// Album.tsx
import React, { useState } from "react";
import { AlbumWithSongs } from "./api";

interface AlbumProps {
  album: AlbumWithSongs;
}

// Error image to show when album art fails to load
const ERROR_IMAGE_URL = "https://via.placeholder.com/100?text=Error";

const Album: React.FC<AlbumProps> = ({ album }) => {
  const [imageError, setImageError] = useState(false);

  // Intentionally flawed image loading
  // The src has a typo (adding an extra 's' in https) which will cause loading to fail
  // This gives candidates an opportunity to troubleshoot
  const imageUrl = album.artworkUrl100.replace("https://", "httpss://");

  return (
    <div
      className="border rounded-lg overflow-hidden shadow-md"
      data-testid="album-container"
    >
      <div className="p-4">
        <div className="flex items-start mb-4">
          <div className="mr-4">
            <img
              src={imageError ? ERROR_IMAGE_URL : imageUrl}
              alt={`${album.collectionName} cover`}
              className="w-24 h-24 object-cover"
              onError={() => setImageError(true)}
              data-testid="album-artwork"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold" data-testid="album-title">
              {album.collectionName}
            </h3>
            <p className="text-gray-600" data-testid="artist-name">
              {album.artistName}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Tracks:</h4>
          {album.songs && album.songs.length > 0 ? (
            <ul className="list-disc pl-5" data-testid="tracks-list">
              {album.songs
                .sort((a, b) => a.trackNumber - b.trackNumber)
                .map((song) => (
                  <li key={song.trackId} className="mb-1">
                    {song.trackName}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No tracks available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Album;
