// Albums.tsx
import React from "react";
import { AlbumWithSongs } from "./api";
import Album from "./Album";

interface AlbumsProps {
  albums: AlbumWithSongs[];
}

const Albums: React.FC<AlbumsProps> = ({ albums }) => {
  // Only show unique albums (some may be duplicated in the API response)
  const uniqueAlbums = albums.filter(
    (album, index, self) =>
      index === self.findIndex((a) => a.collectionId === album.collectionId)
  );

  return (
    <div data-testid="albums-container">
      <h2 className="text-2xl font-semibold mb-4">
        {albums[0]?.artistName}'s Albums
      </h2>

      {uniqueAlbums.length === 0 ? (
        <p>No albums found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueAlbums.map((album) => (
            <Album key={album.collectionId} album={album} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Albums;
