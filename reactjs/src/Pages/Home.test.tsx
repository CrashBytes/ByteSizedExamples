// Home.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./Home";
import * as api from "./api";

// Mock the API module
jest.mock("./api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("Home Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the search input", () => {
    render(<Home />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter artist name...")
    ).toBeInTheDocument();
  });

  test("displays loading state while fetching albums", async () => {
    // Mock API response with delay to show loading state
    mockedApi.getArtistAlbumsByName.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(<Home />);

    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByText("Loading albums...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading albums...")).not.toBeInTheDocument();
    });
  });

  // TODO: Test that API is called with correct search term
  test.todo("calls API with correct search term");

  // TODO: Test that albums are displayed when results are returned
  test.todo("displays albums when API returns results");

  // TODO: Test error handling
  test.todo("displays error message when API call fails");

  // TODO: Test debouncing (once implemented)
  test.todo("debounces API calls when search term changes rapidly");
});
