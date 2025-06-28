// Mock namespace response data
export const mockNamespacesResponse = {
  namespaces: [
    {
      name: "test-namespace",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Mock email response data
export const mockEmailsResponse = {
  emails: [
    {
      id: "email-123",
      from: { address: "sender@example.com", name: "Sender" },
      to: [{ address: "recipient@test-namespace.mailisk.net", name: "Recipient" }],
      subject: "Test Email",
      html: "<p>Test content</p>",
      text: "Test content",
      received_date: new Date().toISOString(),
      received_timestamp: Math.floor(Date.now() / 1000),
      expires_timestamp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
  ],
  count: 1,
};

// Mock attachment response data
export const mockAttachmentResponse = {
  id: "attachment-123",
  filename: "test.txt",
  content_type: "text/plain",
  size: 100,
  expires_at: "Fri, 23 Jun 2025 02:29:13 GMT",
  download_url: "https://example.com/attachment-123.txt",
};

// Mock SMTP settings response
export const mockSmtpSettingsResponse = {
  host: "smtp.mailisk.com",
  port: 25,
  secure: false,
  auth: {
    user: "test-namespace",
    pass: "mock-password",
  },
};
