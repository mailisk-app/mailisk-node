# Mailisk Node Client

Mailisk is an end-to-end email and SMS testing platform. It allows you to receive emails and SMS messages with code to automate tests.

- Get a unique subdomain and unlimited email addresses for free.
- Easily automate E2E password reset and account verification by catching emails.
- Receive SMS messages and automate SMS tests.
- Generate TOTP authenticator codes and manage saved TOTP devices.
- Outbound email and virtual SMS support to test without 3rd party clients.

## Get started

For a more step-by-step walkthrough see the [NodeJS Guide](https://docs.mailisk.com/guides/nodejs.html).

- [Mailisk Node Client](#mailisk-node-client)
  - [Get started](#get-started)
    - [Requirements](#requirements)
    - [Installation](#installation)
      - [Install with npm](#install-with-npm)
      - [Install with Yarn](#install-with-yarn)
    - [Usage](#usage)
    - [API Reference](#api-reference)
  - [Client functions (Email)](#client-functions-email)
    - [`searchInbox(namespace, params?, requestOptions?)`](#searchinboxnamespace-params-requestoptions)
      - [Quick examples](#quick-examples)
      - [Filter by destination address](#filter-by-destination-address)
    - [`listNamespaces()`](#listnamespaces)
    - [`getAttachment(attachmentId)`](#getattachmentattachmentid)
    - [`downloadAttachment(attachmentId)`](#downloadattachmentattachmentid)
      - [Quick examples](#quick-examples-1)
  - [Client functions (Outbound Email)](#client-functions-outbound-email)
    - [`sendEmail(namespace, params)`](#sendemailnamespace-params)
    - [`getOutboundEmail(outboundEmailId)`](#getoutboundemailoutboundemailid)
    - [`replyToEmail(emailId, params)`](#replytoemailemailid-params)
    - [`forwardEmail(emailId, params)`](#forwardemailemailid-params)
  - [Client functions (SMS)](#client-functions-sms)
    - [`searchSmsMessages(phoneNumber, params?, requestOptions?)`](#searchsmsmessagesphonenumber-params-requestoptions)
      - [Quick examples](#quick-examples-2)
    - [`listSmsNumbers()`](#listsmsnumbers)
    - [`sendVirtualSms(params)`](#sendvirtualsmsparams)
  - [Client functions (TOTP)](#client-functions-totp)
    - [`listTotpDevices(params?)`](#listtotpdevicesparams)
    - [`createTotpDevice(params)`](#createtotpdeviceparams)
    - [`createCustomTotpDevice(params)`](#createcustomtotpdeviceparams)
    - [`createTotpDeviceFromBase32SecretKey(params)`](#createtotpdevicefrombase32secretkeyparams)
    - [`createTotpDeviceFromOtpAuthUrl(params)`](#createtotpdevicefromotpauthurlparams)
    - [`getTotpOtpBySharedSecret(sharedSecret, params?)`](#gettotpotpbysharedsecretsharedsecret-params)
    - [`getTotpOtpByDeviceId(deviceId, params?)`](#gettotpotpbydeviceiddeviceid-params)
    - [`deleteTotpDevice(deviceId)`](#deletetotpdevicedeviceid)

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

// send outbound email
await mailisk.sendEmail(namespace, {
  to: ["verified@example.com"],
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

## Client functions (Outbound Email)

Outbound email methods call the Mailisk API to create, queue, and inspect email delivery.

### `sendEmail(namespace, params)`

Create and queue a new outbound email from a namespace. Recipients must be verified external destinations or addresses under the same namespace. Messages sent only to the same namespace do not consume outbound usage because they are counted as inbound email when delivered.

```js
const outboundEmail = await mailisk.sendEmail("mynamespace", {
  from: {
    email: "support@mynamespace.mailisk.net",
    name: "Support",
  },
  to: ["verified@example.com"],
  subject: "Hello from Mailisk",
  text: "This is the plain text body.",
  html: "<p>This is the HTML body.</p>",
});

console.log(outboundEmail.id, outboundEmail.status);
```

Attachments use base64 encoded content:

```js
const fs = require("node:fs");
const attachmentContent = fs.readFileSync("report.txt");

await mailisk.sendEmail("mynamespace", {
  to: ["verified@example.com"],
  subject: "Report",
  text: "Attached.",
  attachments: [
    {
      filename: "report.txt",
      content_type: "application/octet-stream",
      content_base64: attachmentContent.toString("base64"),
    },
  ],
});
```

### `getOutboundEmail(outboundEmailId)`

Fetch the current delivery state for an outbound email, including recipient delivery statuses and provider events.

```js
const outboundEmail = await mailisk.getOutboundEmail(outboundEmailId);

console.log(outboundEmail.delivery_summary.delivered);
console.log(outboundEmail.recipients);
```

### `replyToEmail(emailId, params)`

Create and queue a reply to an inbound email returned by `searchInbox`. Mailisk derives the reply recipient and threading headers from the source email.

```js
const { data: emails } = await mailisk.searchInbox("mynamespace", {
  to_addr_prefix: "support@mynamespace.mailisk.net",
});

const reply = await mailisk.replyToEmail(emails[0].id, {
  text: "Thanks, we received your message.",
});

console.log(reply.id);
```

### `forwardEmail(emailId, params)`

Create and queue a forwarded copy of an inbound email.

```js
const forwarded = await mailisk.forwardEmail(emailId, {
  to: ["verified@example.com"],
  text: "Forwarding this along.",
});

console.log(forwarded.id);
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
  { timeout: 10_000 },
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
  shared_secret: "JBSWY3DPEHPK3PXP",
  expires_at: "2026-06-01T12:00:00.000Z",
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
  base32_secret_key: "JBSWY3DPEHPK3PXP",
  username: "qa@example.com",
  issuer: "GitHub",
});
```

### `createTotpDeviceFromOtpAuthUrl(params)`

Create a saved TOTP device from an `otpauth://totp/...` URL.

```js
const device = await mailisk.createTotpDeviceFromOtpAuthUrl({
  otp_auth_url: "otpauth://totp/GitHub:qa@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub",
});
```

### `getTotpOtpBySharedSecret(sharedSecret, params?)`

Generate a TOTP code from a shared secret without saving a device.
Pass `min_seconds_until_expire` to wait for the next TOTP period when the current code has fewer seconds left.

```js
const otp = await mailisk.getTotpOtpBySharedSecret("JBSWY3DPEHPK3PXP", {
  min_seconds_until_expire: 10,
});

console.log(otp.code);
console.log(otp.expires);
```

### `getTotpOtpByDeviceId(deviceId, params?)`

Generate a TOTP code for a saved device.
Pass `min_seconds_until_expire` to wait for the next TOTP period when the current code has fewer seconds left.

```js
const otp = await mailisk.getTotpOtpByDeviceId(device.id, {
  min_seconds_until_expire: 10,
});
```

### `deleteTotpDevice(deviceId)`

Delete a saved TOTP device.

```js
await mailisk.deleteTotpDevice(device.id);
```
