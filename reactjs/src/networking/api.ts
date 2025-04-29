// api.ts
interface Artist {
  artistId: number;
  artistName: string;
}

interface Album {
  collectionId: number;
  collectionName: string;
  artworkUrl100: string;
  artistName: string;
}

interface Song {
  trackId: number;
  trackName: string;
  trackNumber: number;
}

export interface AlbumWithSongs extends Album {
  songs: Song[];
}

// Intentionally add a delay to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const searchArtists = async (query: string): Promise<Artist[]> => {
  if (!query) return [];

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&entity=musicArtist&limit=5`
    );
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching artists:", error);
    return [];
  }
};

export const getArtistAlbums = async (artistId: number): Promise<Album[]> => {
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=10`
    );
    const data = await response.json();
    // Filter out the first result which is the artist
    return data.results.slice(1);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return [];
  }
};

export const getAlbumSongs = async (albumId: number): Promise<Song[]> => {
  try {
    // Add artificial delay to make debounce implementation more obvious
    await delay(300);

    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${albumId}&entity=song`
    );
    const data = await response.json();
    // Filter out the first result which is the album
    return data.results.slice(1);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
};

// This is a composite function that gets all albums for an artist by name
// It's intentionally inefficient to give candidates an opportunity to optimize
export const getArtistAlbumsByName = async (
  artistName: string
): Promise<AlbumWithSongs[]> => {
  try {
    // Search for the artist
    const artists = await searchArtists(artistName);
    if (artists.length === 0) return [];

    // Get the first matching artist
    const artist = artists[0];

    // Get albums for that artist
    const albums = await getArtistAlbums(artist.artistId);

    // For each album, get the songs
    const albumsWithSongs = await Promise.all(
      albums.map(async (album) => {
        const songs = await getAlbumSongs(album.collectionId);
        return {
          ...album,
          songs,
        };
      })
    );

    return albumsWithSongs;
  } catch (error) {
    console.error("Error fetching artist albums with songs:", error);
    return [];
  }
};
