# AGENTS.md — Sample Bloated Version
# This is used for demo/testing purposes

## Validation
- Use Zod for all input validation at API boundaries
- Never trust raw req.body from HTTP requests
- Validate all UUID inputs with proper regex
- Check array lengths before processing

## Testing  
- Write unit tests for every exported function
- Aim for 90%+ code coverage
- Use vitest over jest for performance
- Mock external API calls in tests
- Always test edge cases and error paths

## Architecture
- Keep routes in separate files from business logic
- Never call database directly from API handlers
- Use service layer pattern for all data operations
- Keep components under 200 lines of code
- Split files when they exceed 300 lines

## Error Handling
- Return proper HTTP status codes (not always 500)
- Log all errors with context information
- Never expose database errors to clients
- Implement circuit breaker for external APIs
- Use custom error classes, not strings

## TypeScript
- Use strict mode in tsconfig.json
- Avoid any type; use unknown and type guards
- Export types from shared index files
- Use interfaces for object contracts
- Implement discriminated unions for variants

## Code Style
- Use 2-space indentation everywhere
- Prefer const over let over var
- Use arrow functions for callbacks
- Add JSDoc comments to every function
- Use TypeScript strict null checks

## Deployment
- Always run tests before deploying
- Use environment variables for secrets
- Pin all dependency versions exactly
- Document breaking changes in CHANGELOG
- Run security audit before production
