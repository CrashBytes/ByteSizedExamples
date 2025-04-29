import React from "react";
import { render, screen } from "@testing-library/react";
import Albums from "./Albums";
import { AlbumWithSongs } from "../networking/api";

describe("Albums Component", () => {
  const mockAlbums: AlbumWithSongs[] = [
    {
      collectionId: 123,
      collectionName: "Album 1",
      artworkUrl100: "https://example.com/album1.jpg",
      artistName: "Test Artist",
      songs: [
        { trackId: 1, trackName: "Song 1", trackNumber: 1 },
        { trackId: 2, trackName: "Song 2", trackNumber: 2 },
      ],
    },
    {
      collectionId: 456,
      collectionName: "Album 2",
      artworkUrl100: "https://example.com/album2.jpg",
      artistName: "Test Artist",
      songs: [
        { trackId: 3, trackName: "Song 3", trackNumber: 1 },
        { trackId: 4, trackName: "Song 4", trackNumber: 2 },
      ],
    },
  ];

  test("renders the artist name as a heading", () => {
    render(<Albums albums={mockAlbums} />);
    expect(screen.getByText("Test Artist's Albums")).toBeInTheDocument();
  });

  test("renders correct number of Album components", () => {
    render(<Albums albums={mockAlbums} />);
    const albumElements = screen.getAllByTestId("album-container");
    expect(albumElements).toHaveLength(2);
  });

  test("displays message when no albums are found", () => {
    render(<Albums albums={[]} />);
    expect(screen.getByText("No albums found.")).toBeInTheDocument();
  });

  // TODO: Test that duplicate albums are filtered out correctly
  test.todo("filters out duplicate albums");

  // TODO: Test for proper grid layout
  test.todo("applies correct grid layout classes");
});
