# @julach-earzan/email-template-builder

React email editor: drag-and-drop sections and blocks, preview, and email-safe HTML export. Optional hooks POST uploads and template saves to your own API.

## Requirements

- **React** 18+ and **React DOM** 18+ (peer dependencies; install them in your app).

## Install

```bash
npm install @julach-earzan/email-template-builder
```

## Styles

Import the bundled stylesheet once (for example in your app entry or layout):

```tsx
import '@julach-earzan/email-template-builder/style.css'
```

## Basic usage

```tsx
import { EmailBuilder } from '@julach-earzan/email-template-builder'
import '@julach-earzan/email-template-builder/style.css'

export function EditorPage() {
  return <EmailBuilder />
}
```

## Optional API integration

When `api` is set and you pass URLs, the editor can upload images/icons to your server and POST the exported HTML + JSON when the user opens **Export HTML**.

```tsx
<EmailBuilder
  api
  imgUrl={{ method: 'post', url: 'https://api.example.com/upload' }}
  exportUrl={{ method: 'post', url: 'https://api.example.com/templates' }}
  loadUrl={{ method: 'get', url: 'https://api.example.com/templates/1' }}
  credentials="include"
  onTemplateChange={(template) => {
    /* optional: keep a copy in parent state */
  }}
/>
```

### Props

| Prop | Purpose |
| ---- | ------- |
| `api` | Enables HTTP behavior for `imgUrl`, `exportUrl`, and `loadUrl`. |
| `imgUrl` | Multipart upload for **image** and **button icon** file picks. Default form field: `file` (override with `uploadFieldName`). |
| `exportUrl` | On **Export HTML**, POSTs JSON `{ html, template }` as well as showing the HTML in the modal. |
| `loadUrl` | Loads initial template JSON on mount. **Not used** if `template` is set (controlled mode). |
| `template` | Controlled document; updates when this value’s JSON serialization changes. |
| `credentials` | Passed to every `fetch` (`omit` \| `same-origin` \| `include`). |
| `uploadFieldName` | Upload field name (default `file`). |
| `parseUploadResponse` | `(json) => string \| undefined` if your upload response shape is custom. |
| `buildExportBody` / `buildExportHeaders` | Customize the export request body and headers. |
| `onTemplateChange` | Called when the document changes (deduped by JSON). |
| `onExportSuccess` / `onExportError` | Export POST callbacks. |
| `onLoadError` | Load failure or invalid `template` JSON. |
| `className` / `style` | Wrapper around the editor shell. |

**Upload response:** The client looks for a public image URL in common JSON fields (`url`, `src`, `path`, `data.url`, etc.) or a plain-text URL body.

**Export body (default):** `Content-Type: application/json` with `{ "html": string, "template": EmailTemplate }`.

## Other exports

From the package entry you may also import:

- `generateEmailHTML`, `generateEmailHTMLFromJson`, `generateEmailHTMLFromUnknown`
- `normalizeEmailTemplate`, `emptyEmailTemplate`
- Types: `EmailTemplate`, `EmailBuilderProps`, `ApiEndpoint`, and block/content types (see the package typings).

## Limitation

Editor state uses a **single global store**. Use **one** active `EmailBuilder` per page unless you integrate a per-instance store yourself.

## License

MIT © julach-earzan
