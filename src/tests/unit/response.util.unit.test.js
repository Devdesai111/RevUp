'use strict';

const { sendSuccess, sendCreated, sendError, sendPaginated, sendAccepted } = require('../../utils/response.util');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('response.util', () => {
  describe('sendSuccess', () => {
    it('should send 200 with success shape', () => {
      const res = mockRes();
      sendSuccess(res, { message: 'OK', data: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
    });
  });

  describe('sendCreated', () => {
    it('should send 201 with success shape', () => {
      const res = mockRes();
      sendCreated(res, { message: 'Created', data: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Created', data: { id: 2 } });
    });
  });

  describe('sendError', () => {
    it('should send error with correct shape', () => {
      const res = mockRes();
      sendError(res, { message: 'Bad', code: 'BAD_REQUEST', statusCode: 400 });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false, message: 'Bad', code: 'BAD_REQUEST', errors: [],
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response', () => {
      const res = mockRes();
      const pagination = { page: 1, limit: 10, total: 25, totalPages: 3 };
      sendPaginated(res, { message: 'List', data: [1, 2], pagination });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true, message: 'List', data: [1, 2], pagination,
      });
    });
  });

  describe('sendAccepted', () => {
    it('should send 202 with jobId', () => {
      const res = mockRes();
      sendAccepted(res, { message: 'Processing', jobId: 'job-123' });
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true, message: 'Processing', data: { jobId: 'job-123' },
      });
    });
  });
});
