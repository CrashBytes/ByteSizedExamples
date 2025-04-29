# iTunes Search Interview Tool

This project is an interview assessment tool designed to evaluate a candidate's ability to identify and fix common issues in a React application.

## Project Overview

The application allows users to search for musical artists using the iTunes API and displays their albums and songs. The UI is simple and focused on functionality rather than design. The app has intentional flaws that a candidate would be expected to identify and potentially fix during an interview.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Run the tests:
   ```bash
   yarn test
   ```
4. Start the development server:
   ```bash
   yarn start
   ```

## Instructions for Candidates

### Your Task

You are presented with a React application that allows users to search for artists on iTunes and view their albums and songs. The application has several issues that need to be identified and fixed. Your task is to:

1. **Understand the codebase**: Familiarize yourself with the project structure and how the components interact.
2. **Identify performance issues**: The search functionality has no debouncing, causing unnecessary API calls.
3. **Fix image loading**: Album artwork fails to load properly - identify why and implement a fix.
4. **Enhance test coverage**: Several test cases are marked as "todo" - implement at least one of them.
5. **Improve API testing**: The networking layer has low test coverage - enhance it using the provided mock data.

### Key Components

- **Home.tsx**: Main search component that manages state and API calls
- **Albums.tsx**: Component that displays a list of albums
- **Album.tsx**: Component for displaying an individual album with tracks
- **api.ts**: API functions for interacting with the iTunes API

### Known Issues (for your reference)

1. **Performance**: The search input triggers an API call on every keystroke without debouncing
2. **Image Loading**: Album artwork doesn't display correctly
3. **Test Coverage**: The API functions need more thorough testing
4. **Optional Enhancements**: You may suggest additional improvements such as loading states, error handling, or UI enhancements

### Testing Resources

The project includes mock API responses to help with testing:

- **mockApiResponses.ts**: Contains realistic mock data for artists, albums, and songs
- **HomeWithMocks.test.tsx**: Example of how to use the mock responses in tests

You can use these resources to implement the missing tests and verify your fixes.

## Evaluation Criteria

You will be evaluated on:

1. **Code comprehension**: How quickly you understand the codebase
2. **Problem-solving**: Your approach to identifying and fixing issues
3. **Testing**: Your ability to write meaningful tests
4. **Communication**: How clearly you explain your thought process and solutions
5. **Code quality**: The clarity, maintainability, and organization of your code

## Tips for Success

- Start by running the application and exploring its functionality
- Look for console errors and unexpected behavior
- Use the test suite to understand component behavior
- Think about how debouncing could be implemented for search optimization
- Examine the image URL construction in the Album component
- Consider how the application handles edge cases like empty results or errors
- Be prepared to explain your reasoning for each fix or enhancement

## Project Structure

```
reactjs/
├── src/
│   ├── components/
│   │   ├── Album.tsx
│   │   ├── Album.test.tsx
│   │   ├── Albums.tsx
│   │   └── Albums.test.tsx
│   ├── Pages/
│   │   ├── Home.tsx
│   │   └── Home.test.tsx
│   └── networking/
│       └── api.ts
├── mockApiResponses.ts
├── HomeWithMocks.test.tsx
├── jest.config.js
├── jest.setup.js
└── package.json
```

Good luck! We're looking forward to seeing your solutions and hearing your thoughts on improving this application.
