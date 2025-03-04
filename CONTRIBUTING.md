# Contributing to Search1API MCP Server

Thank you for your interest in contributing to the Search1API MCP Server! This document provides guidelines and instructions for contributing to this project.

## Development Environment Setup

1. **Prerequisites**
   - Node.js (v18 or higher)
   - npm (v7 or higher)

2. **Clone the Repository**
   ```bash
   git clone https://github.com/CorbettCajun/search1api-mcp.git
   cd search1api-mcp
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Development Commands**
   - `npm run build` - Build the TypeScript files
   - `npm run watch` - Watch for changes and rebuild automatically
   - `npm run inspector` - Run the MCP inspector

## TypeScript Guidelines

This project uses TypeScript to improve code quality and maintainability. Please follow these guidelines when contributing:

1. **Type Definitions**
   - Always define types for function parameters and return values
   - Use interfaces for complex objects
   - Avoid using `any` type when possible

2. **Code Organization**
   - Keep files focused on a single responsibility
   - Use meaningful file and directory names
   - Group related functionality together

3. **Code Style**
   - Follow the existing code style in the project
   - Use meaningful variable and function names
   - Add comments for complex logic

## Pull Request Process

1. **Fork the Repository**
   - Fork the repository to your GitHub account
   - Create a new branch for your feature or bug fix

2. **Make Your Changes**
   - Implement your feature or bug fix
   - Add or update tests as necessary
   - Ensure all tests pass
   - Update documentation as needed

3. **Submit a Pull Request**
   - Create a pull request from your branch to the main repository
   - Provide a clear description of the changes
   - Reference any related issues

4. **Code Review**
   - Address any feedback from code review
   - Make necessary changes and push to your branch

## Testing

- Write tests for new functionality
- Ensure all existing tests pass before submitting a pull request
- Test your changes with different configurations and environments

## Documentation

- Update the README.md file with any new features or changes
- Document any new API endpoints or parameters
- Provide examples for new functionality

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.
