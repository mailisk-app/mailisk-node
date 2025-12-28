import { Attachment } from "nodemailer/lib/mailer";

export interface EmailAddress {
  /** Email address */
  address: string;
  /** Display name, if one is specified */
  name?: string;
}

export interface EmailAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** Filename of the attachment */
  filename: string;
  /** Content type of the attachment */
  content_type: string;
  /** Size in bytes of the attachment */
  size: number;
}

export interface Email {
  /** Namespace scoped ID */
  id: string;
  /** Sender of email */
  from: EmailAddress;
  /** Recepients of email */
  to: EmailAddress[];
  /** Carbon-copied recipients for email message */
  cc?: EmailAddress[];
  /** Blind carbon-copied recipients for email message */
  bcc?: EmailAddress[];
  /** Subject of email */
  subject?: string;
  /** Email content that was sent in HTML format */
  html?: string;
  /** Email content that was sent in plain text format */
  text?: string;
  /** The datetime that this email was received */
  received_date: Date;
  /** The unix timestamp (s) that this email was received */
  received_timestamp: number;
  /** The unix timestamp (s) when this email will be deleted */
  expires_timestamp: number;
  /** The spam score as reported by SpamAssassin */
  spam_score?: number;
  /** The headers of the email */
  headers?: Record<string, string>;
  /** The attachments of the email */
  attachments?: EmailAttachment[];
}

export interface SmsMessage {
  /** Unique identifier for the message */
  id: string;
  /** Unique identifier for the SMS phone number */
  sms_phone_number_id: string;
  /** Body of the message */
  body: string;
  /** From number of the message */
  from_number: string;
  /** To number of the message */
  to_number: string;
  /** Provider message ID */
  provider_message_id?: string;
  /** Date and time the message was created */
  created_at: string;
  /** Direction of the message */
  direction: "inbound" | "outbound";
}

export interface SmsNumber {
  /** Unique identifier for the SMS number */
  id: string;
  /** Unique identifier for the organisation */
  organisation_id: string;
  /** Status of the SMS number */
  status: "requested" | "active" | "disabled";
  /** Country of the SMS number */
  country: string;
  /** SMS Phone number */
  phone_number?: string;
  /** Date and time the SMS number was created */
  created_at: string;
  /** Date and time the SMS number was updated */
  updated_at: string;
}

export interface SearchInboxParams {
  /**
   * The maximum number of emails that can be returned in this request, used alongside `offset` for pagination.
   */
  limit?: number;
  /**
   * The number of emails to skip/ignore, used alongside `limit` for pagination.
   */
  offset?: number;
  /**
   * Filter emails by starting unix timestamp in seconds.
   */
  from_timestamp?: number;
  /**
   * Filter emails by ending unix timestamp in seconds.
   */
  to_timestamp?: number;
  /**
   * Filter emails by 'to' address. Address must start with this.
   *
   * 'foo' would return for 'foobar@namespace.mailisk.net' but not 'barfoo@namespace.mailisk.net'
   */
  to_addr_prefix?: string;
  /**
   * Filter emails by 'from' address. Address must include this.
   *
   * '@foo' would return for 'a@foo.com', 'b@foo.net'
   */
  from_addr_includes?: string;
  /**
   * Filter emails by subject. This is case insensitive. Subject must include this.
   *
   * 'password' would return for 'Password reset', 'Reset password notification' but not 'Reset'
   */
  subject_includes?: string;
  /**
   * Will keep the request going till at least one email would be returned.
   *
   * Default is `true`
   */
  wait?: boolean;
}

export interface SearchInboxResponse {
  /**
   * Total number of emails matching query.
   */
  total_count: number;
  /**
   * Parameters that were used for the query
   */
  options: SearchInboxParams;
  /**
   * Emails
   */
  data: Email[];
}

export interface SmtpSettings {
  data: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

export interface GetAttachmentResponse {
  data: {
    id: string;
    filename: string;
    content_type: string;
    size: number;
    expires_at: string | null;
    download_url: string;
  };
}

export interface ListNamespacesResponse {
  total_count: number;
  data: { id: string; namespace: string }[];
}

export interface SendVirtualEmailParams {
  /** Sender of email */
  from: string;
  /**
   * Recepients of email
   *
   * Must match namespace. E.g. if using namespace 'mynamespace' `to` must be 'something@mynamespace.mailisk.net'.
   */
  to: string;
  /** The subject of the e-mail */
  subject: string;
  /** The plaintext version of the message */
  text?: string | undefined;
  /** The HTML version of the message */
  html?: string | undefined;
  /** Custom headers for the email */
  headers?: Record<string, string>;
  /** Attachments to the email */
  attachments?: Attachment[];
}

export interface SearchSmsMessagesParams {
  /**
   * The maximum number of SMS messages returned (1-100), used alongside `offset` for pagination.
   */
  limit?: number;
  /**
   * The number of SMS messages to skip/ignore, used alongside `limit` for pagination.
   */
  offset?: number;
  /**
   * Filter messages by body contents (case insensitive).
   */
  body?: string;
  /**
   * Filter messages by sender phone number prefix.
   */
  from_number?: string;
  /**
   * Filter messages created on or after this date.
   * Provide an ISO 8601 timestamp string.
   */
  from_date?: string;
  /**
   * Filter messages created on or before this date.
   * Provide an ISO 8601 timestamp string.
   */
  to_date?: string;
  /**
   * When true, keep the request open until at least one SMS is returned.
   */
  wait?: boolean;
}

export interface SearchSmsMessagesResponse {
  total_count: number;
  options: SearchSmsMessagesParams;
  data: SmsMessage[];
}

export interface ListSmsNumbersResponse {
  total_count: number;
  data: SmsNumber[];
}

export interface SendVirtualSmsParams {
  /** The phone number to send the SMS from */
  from_number: string;
  /** The phone number to send the SMS to */
  to_number: string;
  /** The body of the SMS message */
  body: string;
}
