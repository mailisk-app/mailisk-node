// Mock namespace response data
export const mockNamespacesResponse = {
  total_count: 1,
  data: [
    {
      id: "0fde5afa-a8a8-41a4-9ca4-21d83efc37d8",
      namespace: "test-namespace",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Mock email response data
export const mockEmailsResponse = {
  total_count: 1,
  options: {
    wait: true,
  },
  data: [
    {
      id: "1763808382384-m-m-dEmYI7ic5",
      from: {
        address: "sender@example.com",
        name: "Sender",
      },
      to: [
        {
          address: "recipient@test-namespace.mailisk.net",
          name: "Recipient",
        },
      ],
      subject: "test",
      html: "false",
      text: "test",
      received_date: "2025-11-22T10:46:22.000Z",
      received_timestamp: 1763808382,
      expires_timestamp: 1764672382,
      spam_score: null,
    },
  ],
};

// Mock attachment response data
export const mockAttachmentResponse = {
  data: {
    id: "b04730be-9c13-4f23-a2b7-a4a9a943cd31",
    filename: "Sample.png",
    content_type: "image/png",
    size: 140551,
    expires_at: "2025-09-09T10:03:33.000Z",
    download_url: "url",
  },
};

// Mock SMTP settings response
export const mockSmtpSettingsResponse = {
  data: {
    host: "smtp.mailisk.net",
    port: 587,
    username: "test-namespace",
    password: "mock-password",
  },
};

// Mock SMS messages response data
export const mockSmsMessagesResponse = {
  total_count: 1,
  options: {
    limit: 20,
    offset: 0,
  },
  data: [
    {
      id: "37a2bc57-c2c7-4c08-a9dc-d143bc17643f",
      sms_phone_number_id: "ba548be2-bff9-4e3f-a54b-e034c415e906",
      body: "test newline \\n\\n test2",
      from_number: "+18777804236",
      to_number: "+19285639871",
      provider_message_id: "SMf72eb72b6281a02e60a0114f38e34e36",
      created_at: "2020-11-24T16:48:22.170Z",
      direction: "inbound",
    },
  ],
};

// Mock SMS numbers response data
export const mockSmsNumbersResponse = {
  total_count: 2,
  data: [
    {
      id: "13c4551e-a5be-4959-9ea5-82931dcfc74d",
      organisation_id: "c02bdb84-22df-4c18-85ba-2defdd04eccb",
      status: "requested",
      country: "US",
      created_at: "2020-11-22T16:59:25.462Z",
      updated_at: "2020-11-22T16:59:25.462Z",
    },
    {
      id: "6bf073d6-d333-45c9-b009-c77f0cac7657",
      organisation_id: "ddec2c7b-b087-45b6-a81d-b195f25d457f",
      status: "active",
      country: "US",
      phone_number: "+19285639871",
      created_at: "2020-11-22T16:41:40.329Z",
      updated_at: "2020-11-22T16:41:40.329Z",
    },
  ],
};
