jest.mock("axios");
jest.mock("nodemailer");

import axios from "axios";
import nodemailer from "nodemailer";
import { MailiskClient } from "../../src/mailisk";
import {
  mockNamespacesResponse,
  mockEmailsResponse,
  mockSmtpSettingsResponse,
  mockAttachmentResponse,
} from "../mocks/axios-mocks";

const setupMockAxios = () => {
  jest.clearAllMocks();

  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();

  const mockInstance = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  };

  (axios.create as jest.Mock).mockReturnValue(mockInstance);
  (axios.get as jest.Mock).mockImplementation(jest.fn());

  return {
    mockInstance,
    mockGet,
    mockPost,
    mockPut,
    mockDelete,
  };
};

describe("MailiskClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default baseURL when not provided", () => {
      setupMockAxios();
      const client = new MailiskClient({ apiKey: "test-key" });
      expect(axios.create).toHaveBeenCalledWith({
        headers: {
          "X-Api-Key": "test-key",
        },
        baseURL: "https://api.mailisk.com/",
      });
    });

    it("should initialize with custom baseURL when provided", () => {
      setupMockAxios();
      const client = new MailiskClient({
        apiKey: "test-key",
        baseUrl: "https://custom-api.mailisk.com/",
      });
      expect(axios.create).toHaveBeenCalledWith({
        headers: {
          "X-Api-Key": "test-key",
        },
        baseURL: "https://custom-api.mailisk.com/",
      });
    });
  });

  describe("listNamespaces", () => {
    it("should fetch and return namespaces", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockNamespacesResponse });

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.listNamespaces();

      expect(mockGet).toHaveBeenCalledWith("api/namespaces");
      expect(result).toEqual(mockNamespacesResponse);
    });

    it("should handle errors correctly", async () => {
      const { mockGet } = setupMockAxios();
      const error = new Error("API Error");
      mockGet.mockRejectedValueOnce(error);

      const client = new MailiskClient({ apiKey: "test-key" });

      await expect(client.listNamespaces()).rejects.toThrow("API Error");
    });
  });

  describe("getSmtpSettings", () => {
    it("should fetch and return SMTP settings for a namespace", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockSmtpSettingsResponse });

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.getSmtpSettings("test-namespace");

      expect(mockGet).toHaveBeenCalledWith("api/smtp/test-namespace");
      expect(result).toEqual(mockSmtpSettingsResponse);
    });

    it("should handle errors correctly", async () => {
      const { mockGet } = setupMockAxios();
      const error = new Error("SMTP Settings Error");
      mockGet.mockRejectedValueOnce(error);

      const client = new MailiskClient({ apiKey: "test-key" });

      await expect(client.getSmtpSettings("test-namespace")).rejects.toThrow("SMTP Settings Error");
    });
  });

  describe("getAttachment", () => {
    it("should fetch and return attachment data", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockAttachmentResponse });

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.getAttachment("attachment-123");

      expect(mockGet).toHaveBeenCalledWith("api/attachments/attachment-123");
      expect(result).toEqual(mockAttachmentResponse);
    });
  });

  describe("downloadAttachment", () => {
    it("should download and return attachment data", async () => {
      const getAttachmentSpy = jest.spyOn(MailiskClient.prototype, "getAttachment");
      getAttachmentSpy.mockResolvedValueOnce({ data: mockAttachmentResponse });

      const mockBuffer = Buffer.from("test content");
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockBuffer });

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.downloadAttachment("attachment-123");

      expect(axios.get).toHaveBeenCalledWith(mockAttachmentResponse.download_url, { responseType: "arraybuffer" });
      expect(result).toEqual(mockBuffer);
    });
  });

  describe("searchInbox", () => {
    it("should fetch and return emails with default parameters", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockEmailsResponse });

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.searchInbox("test-namespace");

      expect(mockGet).toHaveBeenCalledWith("api/emails/test-namespace/inbox", {
        maxRedirects: 99999,
        timeout: 1000 * 60 * 5,
        params: {
          from_timestamp: expect.any(Number),
          wait: true,
        },
      });
      expect(result).toEqual(mockEmailsResponse);
    });

    it("should use custom parameters if provided", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockEmailsResponse });

      const customParams = {
        limit: 10,
        offset: 5,
        from_timestamp: 1234567890,
        to_timestamp: 1234567899,
        to_addr_prefix: "john",
        from_addr_includes: "@example.com",
        subject_includes: "test",
        wait: false,
      };

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.searchInbox("test-namespace", customParams);

      expect(mockGet).toHaveBeenCalledWith("api/emails/test-namespace/inbox", {
        maxRedirects: 99999,
        params: customParams,
      });
      expect(result).toEqual(mockEmailsResponse);
    });

    it("should use custom axios config if provided", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({ data: mockEmailsResponse });

      const customParams = {
        wait: true,
      };

      const customConfig = {
        timeout: 10000,
        maxRedirects: 5,
      };

      const client = new MailiskClient({ apiKey: "test-key" });
      const result = await client.searchInbox("test-namespace", customParams, customConfig);

      expect(mockGet).toHaveBeenCalledWith("api/emails/test-namespace/inbox", {
        ...customConfig,
        params: {
          from_timestamp: expect.any(Number),
          wait: true,
        },
      });
      expect(result).toEqual(mockEmailsResponse);
    });

    it("should handle errors correctly", async () => {
      const { mockGet } = setupMockAxios();
      const error = new Error("Search Inbox Error");
      mockGet.mockRejectedValueOnce(error);

      const client = new MailiskClient({ apiKey: "test-key" });

      await expect(client.searchInbox("test-namespace")).rejects.toThrow("Search Inbox Error");
    });
  });

  describe("sendVirtualEmail", () => {
    // Setup for nodemailer mock
    const mockSendMail = jest.fn();
    const mockClose = jest.fn();
    const mockTransport = {
      sendMail: mockSendMail,
      close: mockClose,
    };

    beforeEach(() => {
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransport);
      mockSendMail.mockReset().mockResolvedValue({});
      mockClose.mockReset();
    });

    it("should send an email using nodemailer", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({
        data: {
          data: {
            host: "smtp.mailisk.com",
            port: 25,
            username: "test-namespace",
            password: "mock-password",
          },
        },
      });

      const emailParams = {
        from: "sender@example.com",
        to: "recipient@test-namespace.mailisk.net",
        subject: "Test Subject",
        text: "Test Content",
        html: "<p>Test HTML Content</p>",
        headers: { "X-Custom-Header": "Custom Value" },
      };

      const client = new MailiskClient({ apiKey: "test-key" });
      await client.sendVirtualEmail("test-namespace", emailParams);

      expect(mockGet).toHaveBeenCalledWith("api/smtp/test-namespace");

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.mailisk.com",
        port: 25,
        secure: false,
        auth: {
          user: "test-namespace",
          pass: "mock-password",
        },
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "sender@example.com",
        to: "recipient@test-namespace.mailisk.net",
        subject: "Test Subject",
        text: "Test Content",
        html: "<p>Test HTML Content</p>",
        headers: { "X-Custom-Header": "Custom Value" },
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle errors from SMTP settings fetch", async () => {
      const { mockGet } = setupMockAxios();
      const error = new Error("SMTP Settings Error");
      mockGet.mockRejectedValueOnce(error);

      const emailParams = {
        from: "sender@example.com",
        to: "recipient@test-namespace.mailisk.net",
        subject: "Test Subject",
        text: "Test Content",
      };

      const client = new MailiskClient({ apiKey: "test-key" });

      await expect(client.sendVirtualEmail("test-namespace", emailParams)).rejects.toThrow("SMTP Settings Error");

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it("should handle errors from nodemailer sendMail", async () => {
      const { mockGet } = setupMockAxios();
      mockGet.mockResolvedValueOnce({
        data: {
          data: {
            host: "smtp.mailisk.com",
            port: 25,
            username: "test-namespace",
            password: "mock-password",
          },
        },
      });

      const sendMailError = new Error("Failed to send email");
      mockSendMail.mockRejectedValueOnce(sendMailError);

      const emailParams = {
        from: "sender@example.com",
        to: "recipient@test-namespace.mailisk.net",
        subject: "Test Subject",
        text: "Test Content",
      };

      const client = new MailiskClient({ apiKey: "test-key" });

      await expect(client.sendVirtualEmail("test-namespace", emailParams)).rejects.toThrow("Failed to send email");

      // In the actual implementation, if sendMail throws an error, close won't be called
      // We just verify that sendMail was called
      expect(mockSendMail).toHaveBeenCalled();
    });
  });
});
