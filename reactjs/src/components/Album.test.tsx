// Album.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Album from "./Album";
import { AlbumWithSongs } from "./api";

describe("Album Component", () => {
  const mockAlbum: AlbumWithSongs = {
    collectionId: 123456,
    collectionName: "Test Album",
    artworkUrl100: "https://example.com/album-art.jpg",
    artistName: "Test Artist",
    songs: [
      { trackId: 1, trackName: "Song 1", trackNumber: 1 },
      { trackId: 2, trackName: "Song 2", trackNumber: 2 },
      { trackId: 3, trackName: "Song 3", trackNumber: 3 },
    ],
  };

  test("renders album information correctly", () => {
    render(<Album album={mockAlbum} />);

    expect(screen.getByTestId("album-title")).toHaveTextContent("Test Album");
    expect(screen.getByTestId("artist-name")).toHaveTextContent("Test Artist");
    expect(screen.getByTestId("album-artwork")).toBeInTheDocument();
  });

  test("renders tracks in the correct order", () => {
    render(<Album album={mockAlbum} />);

    const tracksList = screen.getByTestId("tracks-list");
    const tracks = tracksList.querySelectorAll("li");

    expect(tracks).toHaveLength(3);
    expect(tracks[0]).toHaveTextContent("Song 1");
    expect(tracks[1]).toHaveTextContent("Song 2");
    expect(tracks[2]).toHaveTextContent("Song 3");
  });

  test("displays message when no tracks are available", () => {
    const albumWithNoSongs = {
      ...mockAlbum,
      songs: [],
    };

    render(<Album album={albumWithNoSongs} />);

    expect(screen.queryByTestId("tracks-list")).not.toBeInTheDocument();
    expect(screen.getByText("No tracks available")).toBeInTheDocument();
  });

  test("handles image loading errors correctly", () => {
    render(<Album album={mockAlbum} />);

    const albumArtwork = screen.getByTestId("album-artwork");

    // Initially, the image should have the flawed URL
    expect(albumArtwork.getAttribute("src")).toContain("httpss://");

    // Simulate an error when loading the image
    fireEvent.error(albumArtwork);

    // After error, the fallback image should be used
    expect(albumArtwork.getAttribute("src")).toBe(
      "https://via.placeholder.com/100?text=Error"
    );
  });

  test("displays image with correct alt text", () => {
    render(<Album album={mockAlbum} />);

    const albumArtwork = screen.getByTestId("album-artwork");
    expect(albumArtwork).toHaveAttribute("alt", "Test Album cover");
  });

  test("renders with minimal album data", () => {
    const minimalAlbum: AlbumWithSongs = {
      collectionId: 789,
      collectionName: "Minimal Album",
      artworkUrl100: "https://example.com/minimal.jpg",
      artistName: "Minimal Artist",
      songs: [],
    };

    render(<Album album={minimalAlbum} />);

    expect(screen.getByTestId("album-title")).toHaveTextContent(
      "Minimal Album"
    );
    expect(screen.getByTestId("artist-name")).toHaveTextContent(
      "Minimal Artist"
    );
    expect(screen.getByText("No tracks available")).toBeInTheDocument();
  });
});
