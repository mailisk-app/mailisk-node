import axios, { AxiosBasicCredentials, AxiosRequestConfig } from "axios";
import {
  GetAttachmentResponse,
  ListNamespacesResponse,
  SearchInboxParams,
  SearchInboxResponse,
  SendVirtualEmailParams,
  SmtpSettings,
} from "./mailisk.interfaces";
import nodemailer from "nodemailer";

export class MailiskClient {
  constructor({ apiKey, baseUrl, auth }: { apiKey: string; baseUrl?: string; auth?: AxiosBasicCredentials }) {
    this.axiosInstance = axios.create({
      headers: {
        "X-Api-Key": apiKey,
      },
      baseURL: baseUrl || "https://api.mailisk.com/",
      auth,
    });
  }

  private readonly axiosInstance;

  /**
   * List all namespaces that belong to the current account (API key).
   */
  async listNamespaces(): Promise<ListNamespacesResponse> {
    return (await this.axiosInstance.get("api/namespaces")).data;
  }

  /**
   * Send an email using the Virtual SMTP.
   *
   * These emails can only be sent to valid Mailisk namespaces, i.e. emails that end in @mynamespace.mailisk.net
   *
   * @example
   * For example, sending a test email:
   * ```typescript
   * client.sendVirtualEmail(namespace, {
   *   from: "test@example.com",
   *   to: `john@${namespace}.mailisk.net`,
   *   subject: "This is a test",
   *   text: "Testing",
   * });
   * ```
   */
  async sendVirtualEmail(namespace: string, params: SendVirtualEmailParams): Promise<void> {
    const smtpSettings = await this.getSmtpSettings(namespace);

    const transport = nodemailer.createTransport({
      host: smtpSettings.data.host,
      port: smtpSettings.data.port,
      secure: false,
      auth: {
        user: smtpSettings.data.username,
        pass: smtpSettings.data.password,
      },
    });

    const { from, to, subject, text, html, headers, attachments } = params;

    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
      headers,
      attachments,
    });

    transport.close();
  }

  /**
   * Search inbox of a namespace.
   *
   * By default, this calls the api using the `wait` flag. This means the call won't timeout until at least one email is received or 5 minutes pass.
   * It also uses a default `from_timestamp` of **current timestamp - 5 seconds**. This means that older emails will be ignored.
   *
   * Both of these settings can be overriden by passing them in the `params` object.
   *
   * @example
   * Get the latest emails in the namespace
   * ```typescript
   * const { data: emails } = await client.searchInbox(namespace);
   * ```
   *
   * @example
   * Get the latest emails for a specific email address
   * ```typescript
   * const { data: emails } = await client.searchInbox(namespace, {
   *  to_addr_prefix: 'john@mynamespace.mailisk.net'
   * });
   * ```
   */
  async searchInbox(
    namespace: string,
    params?: SearchInboxParams,
    config?: AxiosRequestConfig
  ): Promise<SearchInboxResponse> {
    let _params = { ...params };

    // default from timestamp, 15 minutes before starting this request
    if (params?.from_timestamp === undefined || params?.from_timestamp === null) {
      _params.from_timestamp = Math.floor(new Date().getTime() / 1000) - 15 * 60;
    }

    // by default wait for email
    if (params?.wait !== false) {
      _params.wait = true;
    }

    let _config = { ...config };

    if (!config?.maxRedirects) {
      _config.maxRedirects = 99999;
    }

    // by default, wait 5 minutes for emails before timing out
    if (_params.wait && !config?.timeout) {
      _config.timeout = 1000 * 60 * 5;
    }

    return (
      await this.axiosInstance.get(`api/emails/${namespace}/inbox`, {
        ..._config,
        params: _params,
      })
    ).data;
  }

  /**
   * Get the SMTP settings for a namespace.
   */
  async getSmtpSettings(namespace: string): Promise<SmtpSettings> {
    const result = await this.axiosInstance.get(`api/smtp/${namespace}`);
    return result.data;
  }

  async getAttachment(attachmentId: string): Promise<GetAttachmentResponse> {
    const result = await this.axiosInstance.get(`api/attachments/${attachmentId}`);
    return result.data;
  }

  /**
   * Download an attachment from an attachment ID.
   *
   * @example
   * Download an attachment from an email
   * ```typescript
   * const attachment = email.attachments[0];
   * const attachmentBuffer = await client.downloadAttachment(attachment.id);
   *
   * // save to file
   * fs.writeFileSync(attachment.filename, attachmentBuffer);
   * ```
   */
  async downloadAttachment(attachmentId: string): Promise<Buffer> {
    const result = await this.getAttachment(attachmentId);

    const response = await axios.get(result.data.download_url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  }
}
