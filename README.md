# Mailisk Node Client

Mailisk is an end-to-end email testing platform. It allows you to receive emails with code and automate email tests.

- Get a unique subdomain and unlimited email addresses for free.
- Easily automate E2E password reset and account verification by catching emails.
- Virtual SMTP support to test outbound email without 3rd party clients.

## Get started

For a more step-by-step walkthrough see the [NodeJS Guide](https://docs.mailisk.com/guides/nodejs.html).

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

## Client functions

### `searchInbox(namespace, params?)`

Use `searchInbox` to fetch messages that arrived in a given namespace, optionally waiting until the first new mail shows up.

For the full parameter options see the [endpoint reference](https://docs.mailisk.com/api-reference/search-inbox.html#request-1).

Default behaviour:

- Waits until at least one new email arrives (override with `wait: false`).
- Times out after 5 minutes if nothing shows up (adjust via `requestOptions.timeout`).
- Ignores messages older than 15 minutes to avoid picking up leftovers from previous tests (change via `from_timestamp`).

#### Quick examples

```js
// wait up to the default 5 min for *any* new mail
const { data: emails } = await mailisk.searchInbox(namespace);

// custom 60-second timeout
await mailisk.searchInbox(namespace, {}, { timeout: 1000 * 60 });

// polling pattern — return immediately, even if inbox is empty
await mailisk.searchInbox(namespace, { wait: false });
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

This does not call an API endpoint but rather uses nodemailer to send an email using SMTP.

### `listNamespaces()`

List all namespaces associated with the current API Key.

```js
const namespacesResponse = await mailisk.listNamespaces();

// will be ['namespace1', 'namespace2']
const namespaces = namespacesResponse.map((nr) => nr.namespace);
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
