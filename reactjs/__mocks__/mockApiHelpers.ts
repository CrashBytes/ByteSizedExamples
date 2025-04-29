// mockApiHelpers.ts
// Utility functions for mocking API calls in tests

import {
  mockArtistsResponse,
  mockAlbumsResponse,
  mockSongsResponse,
  mockEmptyResponse,
  mockErrorResponse,
  mockArtistWithAlbumsAndSongs,
  mockDuplicateAlbums,
} from "./mockApiResponses";

// Mock the fetch function in tests
export const setupFetchMock = () => {
  // Mock implementation for the searchArtists function
  const mockSearchArtists = jest.fn().mockImplementation((query: string) => {
    if (!query) return Promise.resolve([]);

    if (query.toLowerCase() === "coldplay") {
      return Promise.resolve(mockArtistsResponse.results);
    }

    if (query.toLowerCase() === "error") {
      return Promise.reject(new Error("Network error"));
    }

    if (query.toLowerCase() === "the beatles") {
      return Promise.resolve([mockDuplicateAlbums.results[0]]);
    }

    return Promise.resolve(mockEmptyResponse.results);
  });

  // Mock implementation for the getArtistAlbums function
  const mockGetArtistAlbums = jest
    .fn()
    .mockImplementation((artistId: number) => {
      if (artistId === 471744) {
        // Coldplay
        // Filter out the first result (the artist) to match real API behavior
        return Promise.resolve(mockAlbumsResponse.results.slice(1));
      }

      if (artistId === 136975) {
        // The Beatles
        // Return albums with duplicates to test filtering
        return Promise.resolve(mockDuplicateAlbums.results.slice(1));
      }

      return Promise.resolve([]);
    });

  // Mock implementation for the getAlbumSongs function
  const mockGetAlbumSongs = jest.fn().mockImplementation((albumId: number) => {
    if (albumId === 1440731628) {
      // Coldplay - Parachutes
      // Filter out the first result (the album) to match real API behavior
      return Promise.resolve(mockSongsResponse.results.slice(1));
    }

    return Promise.resolve([]);
  });

  // Mock implementation for the combined getArtistAlbumsByName function
  const mockGetArtistAlbumsByName = jest
    .fn()
    .mockImplementation((artistName: string) => {
      if (artistName.toLowerCase() === "coldplay") {
        return Promise.resolve(mockArtistWithAlbumsAndSongs.albums);
      }

      if (artistName.toLowerCase() === "the beatles") {
        // Return albums with duplicates to test filtering
        const beatlesAlbums = mockDuplicateAlbums.results
          .slice(1)
          .map((album) => ({
            ...album,
            songs: [], // Add empty songs array to match type
          }));
        return Promise.resolve(beatlesAlbums);
      }

      if (artistName.toLowerCase() === "error") {
        return Promise.reject(new Error("Network error"));
      }

      if (artistName.toLowerCase() === "slow") {
        // Simulate slow response for testing debouncing
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 1000);
        });
      }

      return Promise.resolve([]);
    });

  // Mock the global fetch function
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes("entity=musicArtist")) {
      if (url.includes("term=coldplay")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArtistsResponse),
        });
      } else if (url.includes("term=error")) {
        return Promise.reject(new Error("Network error"));
      } else if (url.includes("term=the%20beatles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDuplicateAlbums),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyResponse),
        });
      }
    } else if (url.includes("lookup") && url.includes("entity=album")) {
      if (url.includes("id=471744")) {
        // Coldplay
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlbumsResponse),
        });
      } else if (url.includes("id=136975")) {
        // The Beatles
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDuplicateAlbums),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyResponse),
        });
      }
    } else if (url.includes("lookup") && url.includes("entity=song")) {
      if (url.includes("id=1440731628")) {
        // Coldplay - Parachutes
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSongsResponse),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyResponse),
        });
      }
    } else {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockErrorResponse),
      });
    }
  });

  return {
    mockSearchArtists,
    mockGetArtistAlbums,
    mockGetAlbumSongs,
    mockGetArtistAlbumsByName,
  };
};

// Example usage in a test file:
/*
  import { setupFetchMock } from './mockApiHelpers';
  import * as api from '../src/networking/api';
  
  jest.mock('../src/networking/api');
  const mockedApi = api as jest.Mocked<typeof api>;
  
  describe('Testing component with API', () => {
    beforeEach(() => {
      const mocks = setupFetchMock();
      
      // Configure your mock implementations
      mockedApi.searchArtists.mockImplementation(mocks.mockSearchArtists);
      mockedApi.getArtistAlbums.mockImplementation(mocks.mockGetArtistAlbums);
      mockedApi.getAlbumSongs.mockImplementation(mocks.mockGetAlbumSongs);
      mockedApi.getArtistAlbumsByName.mockImplementation(mocks.mockGetArtistAlbumsByName);
    });
    
    test('displays albums when search returns results', async () => {
      // Your test code here
    });
  });
  */
