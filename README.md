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
await client.sendVirtualEmail(namespace, {
  from: "test@example.com",
  to: `john@${namespace}.mailisk.net`,
  subject: "Testing",
  text: "This is a test.",
});

// receive email
const result = await client.searchInbox(namespace);

console.log(result);
```

### API Reference

This library wraps the REST API endpoints. Find out more in the [API Reference](https://docs.mailisk.com/api-reference/).

## Client functions

### searchInbox(namespace, params?)

The `searchInbox` function takes a namespace and call parameters.

- By default it uses the `wait` flag. This means the call won't return until at least one email is received. Disabling this flag via `wait: false` can cause it to return an empty response immediately.
- The request timeout is adjustable by passing `timeout` in the request options. By default it uses a timeout of 5 minutes.
- By default `from_timestamp` is set to **current timestamp - 5 seconds**. This ensures that only new emails are returned. Without this, older emails would also be returned, potentially disrupting you if you were waiting for a specific email. This can be overriden by passing the `from_timestamp` parameter (`from_timestmap: 0` will disable filtering by email age).

```js
// timeout of 5 minutes
await mailisk.searchInbox(namespace);
// timeout of 1 minute
await mailisk.searchInbox(namespace, {}, { timeout: 1000 * 60 });
// returns immediately, even if the result would be empty
await mailisk.searchInbox(namespace, { wait: false });
```

#### Filter by destination address

A common use case is filtering the returned emails by the destination address, this is done using the `to_addr_prefix` parameter.

```js
const { data: emails } = await mailisk.searchInbox(namespace, {
  to_addr_prefix: "john@mynamespace.mailisk.net",
});
```

For more parameter options see the [endpoint reference](https://docs.mailisk.com/api-reference/search-inbox.html#request-1).

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

### listNamespaces()

List all namespaces associated with the current API Key.

```js
const namespacesResponse = await mailisk.listNamespaces();

// will be ['namespace1', 'namespace2']
const namespaces = namespacesResponse.map((nr) => nr.namespace);
```
