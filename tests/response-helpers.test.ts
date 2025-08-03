import { createResponse, createErrorResponse, McpResponse } from '../src/response-helpers';

describe('Response Helpers', () => {
  describe('createResponse', () => {
    it('should create a valid response with text content', () => {
      const message = 'Test message';
      const response: McpResponse = createResponse(message);

      expect(response).toEqual({
        content: [{ type: 'text', text: message }]
      });
      expect(response.isError).toBeUndefined();
    });

    it('should handle empty string messages', () => {
      const response: McpResponse = createResponse('');

      expect(response).toEqual({
        content: [{ type: 'text', text: '' }]
      });
    });

    it('should handle special characters in messages', () => {
      const message = 'Special chars: !@#$%^&*()';
      const response: McpResponse = createResponse(message);

      expect(response.content[0].text).toBe(message);
    });
  });

  describe('createErrorResponse', () => {
    // Mock console.error to avoid noise in test output
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should create an error response from string', () => {
      const errorMessage = 'Something went wrong';
      const response: McpResponse = createErrorResponse(errorMessage);

      expect(response).toEqual({
        content: [{ type: 'text', text: `Failed: ${errorMessage}` }],
        isError: true
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${errorMessage}`);
    });

    it('should create an error response from Error object', () => {
      const error = new Error('Test error');
      const response: McpResponse = createErrorResponse(error);

      expect(response).toEqual({
        content: [{ type: 'text', text: `Failed: ${error.message}` }],
        isError: true
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${error.message}`);
    });

    it('should handle Error objects with empty messages', () => {
      const error = new Error('');
      const response: McpResponse = createErrorResponse(error);

      expect(response.content[0].text).toBe('Failed: ');
      expect(response.isError).toBe(true);
    });

    it('should handle custom Error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const response: McpResponse = createErrorResponse(error);

      expect(response.content[0].text).toBe('Failed: Custom error message');
      expect(response.isError).toBe(true);
    });
  });
});