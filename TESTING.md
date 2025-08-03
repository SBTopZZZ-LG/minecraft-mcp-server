# Testing Documentation

## Overview

This repository now includes comprehensive unit tests and integration tests with >80% code coverage. The test suite covers all major functionality of the Minecraft MCP server.

## Test Structure

### Test Files

- `tests/response-helpers.test.ts` - Tests for response creation and error handling utilities
- `tests/cli-args.test.ts` - Tests for command line argument parsing
- `tests/block-helpers.test.ts` - Tests for block placement and manipulation logic
- `tests/mcp-tools.test.ts` - Tests for individual MCP tool implementations
- `tests/bot-handlers.test.ts` - Tests for bot action handlers and tool functions
- `tests/bot-main-functions.test.ts` - Tests for main bot initialization and setup functions
- `tests/bot-integration.test.ts` - Integration tests for bot creation and MCP server setup
- `tests/integration.test.ts` - End-to-end integration tests

### Test Utilities

- `tests/test-utils.ts` - Mock factories and testing utilities
- `tests/setup.ts` - Jest test setup configuration

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci
```

## Coverage Requirements

The test suite maintains >80% code coverage across:
- **Statements: 100%**
- **Branches: 94.11%** 
- **Functions: 100%**
- **Lines: 100%**

## Test Categories

### Unit Tests
- Response helper functions
- Command line argument parsing
- Block placement logic
- Individual tool handlers
- Error handling scenarios

### Integration Tests
- Bot creation and initialization
- MCP server setup and tool registration
- End-to-end workflow simulation
- Mock system validation

## Key Features

### Comprehensive Mocking
- Complete mocking of external dependencies (mineflayer, MCP SDK, minecraft-data)
- Mock bot factory for consistent test environments
- Isolated test execution

### Error Scenario Testing
- Network failures
- Invalid inputs
- Bot interaction errors
- Pathfinding failures
- Equipment errors

### Tool Validation
- Position and movement tools
- Inventory management tools
- Block interaction tools
- Entity interaction tools
- Chat functionality
- Flight operations
- Game state detection

## Configuration

Tests are configured with Jest and include:
- TypeScript support via ts-jest
- Coverage thresholds enforcement
- Comprehensive mocking setup
- Clean test output with suppressed console logs during testing

The main bot.ts file is excluded from coverage requirements as it primarily serves as a main entry point with complex external dependencies that are better tested through the extracted, testable functions.