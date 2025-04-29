# iTunes Search Interview Tool

This project is an interview assessment tool designed to evaluate a candidate's ability to identify and fix common issues in a React application.

## Project Overview

The application allows users to search for musical artists using the iTunes API and displays their albums and songs. The UI is simple and focused on functionality rather than design. The app has intentional flaws that a candidate would be expected to identify and potentially fix during an interview.

## Interview Focus Areas

This tool is designed to test a candidate's ability to:

1. **Understand existing code** - Candidates should be able to navigate the codebase and understand how components interact
2. **Identify performance issues** - The search functionality has no debouncing, causing unnecessary API calls
3. **Troubleshoot broken functionality** - The album artwork doesn't display due to an intentional typo in the URL
4. **Write and understand tests** - Test coverage is set up and some tests are implemented, with others stubbed out

## Interview Questions/Tasks

Here are some suggested questions or tasks to give candidates:

1. "Take a few minutes to explore the codebase and explain how the components work together."
2. "The search functionality works, but it's making too many API calls. How would you improve it?"
3. "Users have reported that the album artwork isn't showing. Can you identify and fix the issue?"
4. "The test coverage for the Albums component is incomplete. Can you implement one of the stubbed tests?"
5. "If you were to enhance this application, what would you add or improve?"

## Key Implementation Details

- **Network Calls**: The API calls in `api.ts` are intentionally inefficient to give candidates an opportunity to optimize
- **Image Loading**: The Album component has a flawed image URL construction, causing images to fail to load
- **Debouncing**: The Home component has no debouncing on the search input
- **Test Coverage**: Jest is configured to measure test coverage, with some tests implemented and others stubbed

## Setup for Interviewers

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server
4. Run `npm test` to run the tests and see coverage report

## Evaluating Candidates

Look for:

- How quickly they identify the issues
- The quality of their solutions
- Their approach to testing
- How well they communicate their understanding and ideas
- Any additional improvements they suggest beyond fixing the obvious issues

## Project Structure

- `api.ts` - Network functions for iTunes API
- `Home.tsx` - Main search component (missing debouncing)
- `Albums.tsx` - Component to display a list of albums
- `Album.tsx` - Component for individual albums (has image loading issue)
- Test files for each component
- Jest configuration for test coverage

## Recommended Interview Duration

45-60 minutes should be sufficient for candidates to explore the code, identify issues, and implement some solutions.
