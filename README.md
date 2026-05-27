# Mailisk Node Client

Mailisk is an end-to-end email and SMS testing platform. It allows you to receive emails and SMS messages with code to automate tests.

- Get a unique subdomain and unlimited email addresses for free.
- Easily automate E2E password reset and account verification by catching emails.
- Receive SMS messages and automate SMS tests.
- Generate TOTP authenticator codes and manage saved TOTP devices.
- Virtual SMTP and SMS support to test without 3rd party clients.

## Get started

For a more step-by-step walkthrough see the [NodeJS Guide](https://docs.mailisk.com/guides/nodejs.html).

### Requirements

- Node.js 18 or newer

### Installation

#### Install with npm

```shell
npm install --save-dev mailisk
```

#### Install with Yarn

```shell
yarn add mailisk --dev
```

### Usage

After installing the library import it and set the [API Key](https://docs.mailisk.com/#getting-your-api-key)

```js
const { MailiskClient } = require("mailisk");

// create client
const mailisk = new MailiskClient({ apiKey: "YOUR_API_KEY" });

// send email (using virtual SMTP)
await mailisk.sendVirtualEmail(namespace, {
  from: "test@example.com",
  to: `john@${namespace}.mailisk.net`,
  subject: "Testing",
  text: "This is a test.",
});

// receive email
const result = await mailisk.searchInbox(namespace);

console.log(result);
```

### API Reference

This library wraps the REST API endpoints. Find out more in the [API Reference](https://docs.mailisk.com/api-reference/).

## Client functions (Email)

### `searchInbox(namespace, params?, requestOptions?)`

Use `searchInbox` to fetch messages that arrived in a given namespace, optionally waiting until the first new mail shows up.

For the full parameter options see the [endpoint reference](https://docs.mailisk.com/api-reference/search-inbox.html#request-1).

Default behaviour:

- Waits until at least one new email arrives (override with `wait: false`).
- Times out after 5 minutes if nothing shows up (adjust via `requestOptions.timeout`).
- Ignores messages older than 15 minutes to avoid picking up leftovers from previous tests (change via `from_timestamp`).

#### Quick examples

```js
// wait up to the default 5 min for *any* new mail
await mailisk.searchInbox(namespace);
// custom 60-second timeout
await mailisk.searchInbox(namespace, {}, { timeout: 1000 * 60 });
// polling pattern — return immediately, even if inbox is empty
await mailisk.searchInbox(namespace, { wait: false });
// returns the last 20 emails in the namespace immediately
await mailisk.searchInbox(namespace, { wait: false, from_timestamp: 0, limit: 20 });
```

#### Filter by destination address

A common pattern is to wait for the email your UI just triggered (e.g. password-reset).
Pass `to_addr_prefix` so you don’t pick up stale messages:

```js
const { data: emails } = await mailisk.searchInbox(namespace, {
  to_addr_prefix: `john@${namespace}.mailisk.net`,
});
```

### sendVirtualEmail(namespace, params)

Send an email using [Virtual SMTP](https://docs.mailisk.com/smtp.html). This will fetch the SMTP settings for the selected namespace and send an email. These emails can only be sent to an address that ends in `@{namespace}.mailisk.net`.

```js
const namespace = "mynamespace";

await mailisk.sendVirtualEmail(namespace, {
  from: "test@example.com",
  to: `john@${namespace}.mailisk.net`,
  subject: "This is a test",
  text: "Testing",
});
```

### `listNamespaces()`

List all namespaces associated with the current API Key.

```js
const { data: namespaces } = await mailisk.listNamespaces();

// will be ['namespace1', 'namespace2']
const namespacesList = namespaces.map((nr) => nr.namespace);
```

### `getAttachment(attachmentId)`

Get information about an attachment.

```ts
const attachment = await mailisk.getAttachment(attachmentId);
```

### `downloadAttachment(attachmentId)`

Retrieve the raw bytes of a file attached to an email message.  
Typically you call this after `searchInbox` → iterate over `email.attachments[]` → pass the desired `attachment.id`.

#### Quick examples

```js
import fs from "node:fs";
import path from "node:path";

// assume 'email' was fetched via searchInbox()
const { id, filename } = email.attachments[0];

// download the attachment
const buffer = await mailisk.downloadAttachment(id);

// save to disk (preserve original filename)
fs.writeFileSync(filename, buffer);
```

Streaming large files

downloadAttachment returns the entire file as a single Buffer.
If you expect very large attachments and want to avoid holding them fully in memory, use getAttachment(attachmentId).download_url and stream with fetch / axios instead:

```js
const meta = await mailisk.getAttachment(id);
const res = await fetch(meta.download_url);
const fileStream = fs.createWriteStream(filename);
await new Promise((ok, err) => res.body.pipe(fileStream).on("finish", ok).on("error", err));
```

## Client functions (SMS)

### `searchSmsMessages(phoneNumber, params?, requestOptions?)`

Fetch recent SMS messages that were delivered to one of your Mailisk phone numbers.  
For the full parameter list see the [Search SMS reference](https://docs.mailisk.com/api-reference/search-sms-messages.html#request).

Default behaviour:

- Waits until at least one SMS matches the filters (override with `wait: false`).
- Times out after 5 minutes if nothing shows up (adjust via `requestOptions.timeout`).
- Ignores messages older than 15 minutes (change via `from_date`).

#### Quick examples

```js
// get or wait for SMS messages sent to ths number
const { data: sms } = await mailisk.searchSmsMessages(phoneNumber);

// look for a verification code coming from a known sender
await mailisk.searchSmsMessages(phoneNumber, {
  from_number: "+1800555",
  body: "Your code",
});

// polling pattern — return immediately even if nothing matched
await mailisk.searchSmsMessages(
  phoneNumber,
  { wait: false, limit: 10, from_date: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { timeout: 10_000 }
);
```

### `listSmsNumbers()`

List all SMS phone numbers associated with the current account.

```js
const { data: phoneNumbers } = await mailisk.listSmsNumbers();
```

### `sendVirtualSms(params)`

Send a virtual SMS message to a phone number you have access to.

```js
await mailisk.sendVirtualSms({
  from_number: "15551234567",
  to_number: "15557654321",
  body: "Test message",
});
```

## Client functions (TOTP)

TOTP methods call the Mailisk API to generate codes and manage saved authenticator devices. The client does not generate TOTP codes locally.

These endpoints require an organisation API key, prefixed with `sk_org_`.

### `listTotpDevices(params?)`

List active saved TOTP devices.

```js
const devices = await mailisk.listTotpDevices({
  limit: 20,
  offset: 0,
  issuer: "GitHub",
  username: "qa@example.com",
});
```

### `createTotpDevice(params)`

Create a saved TOTP device from a Base32 shared secret using default settings: 6 digits, 30 second period, and SHA1.

```js
const device = await mailisk.createTotpDevice({
  name: "GitHub staging",
  sharedSecret: "JBSWY3DPEHPK3PXP",
  expiresAt: "2026-06-01T12:00:00.000Z",
});
```

### `createCustomTotpDevice(params)`

Create a saved TOTP device with custom settings.

```js
const device = await mailisk.createCustomTotpDevice({
  name: "GitHub staging",
  secret: "JBSWY3DPEHPK3PXP",
  username: "qa@example.com",
  issuer: "GitHub",
  digits: 6,
  period: 30,
  algorithm: "SHA1",
});
```

### `createTotpDeviceFromBase32SecretKey(params)`

Create a saved TOTP device from a Base32 secret key.

```js
const device = await mailisk.createTotpDeviceFromBase32SecretKey({
  base32SecretKey: "JBSWY3DPEHPK3PXP",
  username: "qa@example.com",
  issuer: "GitHub",
});
```

### `createTotpDeviceFromOtpAuthUrl(params)`

Create a saved TOTP device from an `otpauth://totp/...` URL.

```js
const device = await mailisk.createTotpDeviceFromOtpAuthUrl({
  otpAuthUrl: "otpauth://totp/GitHub:qa@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub",
});
```

### `getTotpOtpBySharedSecret(sharedSecret)`

Generate a TOTP code from a shared secret without saving a device.

```js
const otp = await mailisk.getTotpOtpBySharedSecret("JBSWY3DPEHPK3PXP");

console.log(otp.code);
console.log(otp.expires);
```

### `getTotpOtpByDeviceId(deviceId)`

Generate a TOTP code for a saved device.

```js
const otp = await mailisk.getTotpOtpByDeviceId(device.id);
```

### `deleteTotpDevice(deviceId)`

Delete a saved TOTP device.

```js
await mailisk.deleteTotpDevice(device.id);
```
