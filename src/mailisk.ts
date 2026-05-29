import axios, { AxiosBasicCredentials, AxiosInstance, AxiosRequestConfig } from "axios";
import {
  CreateBase32SecretKeyTotpDeviceParams,
  CreateCustomTotpDeviceParams,
  CreateOtpAuthUrlTotpDeviceParams,
  CreateTotpDeviceParams,
  GetAttachmentResponse,
  GetTotpOtpParams,
  ListNamespacesResponse,
  ListSmsNumbersResponse,
  ListTotpDevicesParams,
  ListTotpDevicesResponse,
  SearchInboxParams,
  SearchInboxResponse,
  SearchSmsMessagesParams,
  SearchSmsMessagesResponse,
  SendVirtualEmailParams,
  SendVirtualSmsParams,
  SmtpSettings,
  TotpDevice,
  TotpOtpResponse,
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

  private readonly axiosInstance: AxiosInstance;

  /**
   * Search SMS messages sent to a phone number.
   *
   * @example
   * Search for SMS messages sent to a phone number
   * ```typescript
   * const { data: smsMessages } = await client.searchSmsMessages("1234567890");
   * ```
   */
  async searchSmsMessages(
    phoneNumber: string,
    params?: SearchSmsMessagesParams,
    config?: AxiosRequestConfig,
  ): Promise<SearchSmsMessagesResponse> {
    let _params: SearchSmsMessagesParams = { ...params };

    // default from timestamp, 15 minutes before starting this request
    if (params?.from_date === undefined || params?.from_date === null) {
      _params.from_date = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    }

    // by default wait for sms
    if (params?.wait !== false) {
      _params.wait = true;
    }

    let _config = { ...config };

    if (config?.maxRedirects === undefined) {
      _config.maxRedirects = 99999;
    }

    // by default, wait 5 minutes for emails before timing out
    if (_params.wait && config?.timeout === undefined) {
      _config.timeout = 1000 * 60 * 5;
    }

    const requestParams = {
      ..._params,
      from_date: _params.from_date ?? undefined,
      to_date: _params.to_date ?? undefined,
    };

    return (
      await this.axiosInstance.get(`api/sms/${phoneNumber}/messages`, {
        ..._config,
        params: requestParams,
      })
    ).data;
  }

  /**
   * List all SMS phone numbers associated with the current account.
   *
   * @example
   * List all SMS phone numbers
   * ```typescript
   * const { data: smsNumbers } = await client.listSmsNumbers();
   * ```
   */
  async listSmsNumbers(): Promise<ListSmsNumbersResponse> {
    return (await this.axiosInstance.get("api/sms/numbers")).data;
  }

  async sendVirtualSms(params: SendVirtualSmsParams): Promise<void> {
    return (await this.axiosInstance.post("api/sms/virtual", params)).data;
  }

  /**
   * List saved TOTP devices.
   *
   * @example
   * List saved TOTP devices for an issuer and username
   * ```typescript
   * const { items: devices } = await client.listTotpDevices({
   *   issuer: "GitHub",
   *   username: "qa@example.com",
   * });
   * ```
   */
  async listTotpDevices(params?: ListTotpDevicesParams): Promise<ListTotpDevicesResponse> {
    const requestParams: ListTotpDevicesParams = {
      ...params,
      username: params?.username?.trim(),
      issuer: params?.issuer?.trim(),
    };

    return (
      await this.axiosInstance.get("api/devices", {
        params: requestParams,
      })
    ).data;
  }

  /**
   * Create a saved TOTP device from a Base32 shared secret using default TOTP settings.
   *
   * @example
   * Create a saved TOTP device from a shared secret
   * ```typescript
   * const device = await client.createTotpDevice({
   *   name: "GitHub staging",
   *   shared_secret: "JBSWY3DPEHPK3PXP",
   * });
   * ```
   */
  async createTotpDevice(params: CreateTotpDeviceParams): Promise<TotpDevice> {
    return (await this.axiosInstance.post("api/devices", params)).data;
  }

  /**
   * Create a saved TOTP device with custom settings.
   *
   * @example
   * Create a saved TOTP device with custom settings
   * ```typescript
   * const device = await client.createCustomTotpDevice({
   *   name: "GitHub staging",
   *   secret: "JBSWY3DPEHPK3PXP",
   *   username: "qa@example.com",
   *   issuer: "GitHub",
   *   digits: 6,
   *   period: 30,
   *   algorithm: "SHA1",
   * });
   * ```
   */
  async createCustomTotpDevice(params: CreateCustomTotpDeviceParams): Promise<TotpDevice> {
    return (await this.axiosInstance.post("api/devices/custom", params)).data;
  }

  /**
   * Create a saved TOTP device from a Base32 secret key.
   *
   * @example
   * Create a saved TOTP device from a Base32 secret key
   * ```typescript
   * const device = await client.createTotpDeviceFromBase32SecretKey({
   *   base32_secret_key: "JBSWY3DPEHPK3PXP",
   *   username: "qa@example.com",
   *   issuer: "GitHub",
   * });
   * ```
   */
  async createTotpDeviceFromBase32SecretKey(params: CreateBase32SecretKeyTotpDeviceParams): Promise<TotpDevice> {
    return (await this.axiosInstance.post("api/devices/base32-secret-key", params)).data;
  }

  /**
   * Create a saved TOTP device from an otpauth://totp URL.
   *
   * @example
   * Create a saved TOTP device from an otpauth URL
   * ```typescript
   * const device = await client.createTotpDeviceFromOtpAuthUrl({
   *   otp_auth_url: "otpauth://totp/GitHub:qa@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub",
   * });
   * ```
   */
  async createTotpDeviceFromOtpAuthUrl(params: CreateOtpAuthUrlTotpDeviceParams): Promise<TotpDevice> {
    return (await this.axiosInstance.post("api/devices/otpauth-url", params)).data;
  }

  /**
   * Generate a TOTP code from a shared secret without saving a device.
   *
   * @example
   * Generate a TOTP code from a shared secret
   * ```typescript
   * const { code } = await client.getTotpOtpBySharedSecret("JBSWY3DPEHPK3PXP", {
   *   min_seconds_until_expire: 10,
   * });
   * ```
   */
  async getTotpOtpBySharedSecret(sharedSecret: string, params?: GetTotpOtpParams): Promise<TotpOtpResponse> {
    return (await this.axiosInstance.post("api/devices/otp", { shared_secret: sharedSecret, ...params })).data;
  }

  /**
   * Generate a TOTP code for a saved device.
   *
   * @example
   * Generate a TOTP code for a saved device
   * ```typescript
   * const { code } = await client.getTotpOtpByDeviceId(device.id, {
   *   min_seconds_until_expire: 10,
   * });
   * ```
   */
  async getTotpOtpByDeviceId(deviceId: string, params?: GetTotpOtpParams): Promise<TotpOtpResponse> {
    const url = `api/devices/${deviceId}/otp`;

    return params ? (await this.axiosInstance.get(url, { params })).data : (await this.axiosInstance.get(url)).data;
  }

  /**
   * Delete a saved TOTP device.
   *
   * @example
   * Delete a saved TOTP device
   * ```typescript
   * await client.deleteTotpDevice(device.id);
   * ```
   */
  async deleteTotpDevice(deviceId: string): Promise<void> {
    await this.axiosInstance.delete(`api/devices/${deviceId}`);
  }

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
   * It also uses a default `from_timestamp` of **current timestamp - 15 minutes**. This means that older emails will be ignored.
   *
   * Both of these settings can be overriden by passing them in the `params` object.
   *
   * @example
   * Get the latest emails
   * ```typescript
   * const { data: emails } = await client.searchInbox(namespace);
   * ```
   *
   * @example
   * Get the latest emails for a specific email address
   * ```typescript
   * const { data: emails } = await client.searchInbox(namespace, {
   *   to_addr_prefix: 'john@mynamespace.mailisk.net'
   * });
   * ```
   *
   * @example
   * Get the last 20 emails in the namespace
   * ```typescript
   * const { data: emails } = await mailisk.searchInbox(namespace, {
   *   wait: false,
   *   from_timestamp: 0,
   *   limit: 20
   * });
   * ```
   */
  async searchInbox(
    namespace: string,
    params?: SearchInboxParams,
    config?: AxiosRequestConfig,
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

    if (config?.maxRedirects === undefined) {
      _config.maxRedirects = 99999;
    }

    // by default, wait 5 minutes for emails before timing out
    if (_params.wait && config?.timeout === undefined) {
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
