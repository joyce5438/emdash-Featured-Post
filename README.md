# EmDash Featured Post

An EmDash **native plugin** for choosing a single featured post on your homepage. The selection control appears in an expanded section of an existing post's editor. Choosing a different published post replaces the previous selection; clearing it lets your homepage use its own fallback.

## Compatibility and requirements

- Tested with EmDash and `@emdash-cms/admin` **1.3.1**, Astro, React and Cloudflare Workers.
- This is a trusted native plugin, not a sandboxed plugin. Install it as a site dependency; it cannot be installed from the EmDash sandboxed-plugin registry.
- The examples assume the collection slug is `posts`, the image field is `featured_image`, and post URLs use `/posts/<slug>`. Adapt the homepage code to your site's schema and routes.
- The editor panel appears after an entry has been saved. Only published posts can be selected. The operation is saved immediately, independently of the article Save button.
- The plugin stores the selected post ID and slug in plugin settings; it does not modify article content. If a selected post is unpublished, deleted, or its slug changes, the example falls back to the latest post with an image. After changing a slug, select the post again.

## Installation

Install from this GitHub repository in your EmDash site (this project is not currently published to npm):

```sh
npm install github:joyce5438/emdash-Featured-Post
```

Add the descriptor to your existing EmDash `plugins` array in `astro.config.mjs`, preserving your existing configuration:

```js
import { featuredPostPlugin } from "emdash-featured-post";

// Inside emdash({ ... }):
plugins: [
  featuredPostPlugin(),
  // ...your other plugins
],
```

Rebuild and deploy your site. The editor panel alone does **not** alter your homepage: integrate the selected post as described below.

## Homepage integration

Use `getPluginSettings("home-featured")` to read `selected`, retrieve the published entry with `getEmDashEntry`, verify its ID, then render it in your existing featured area. If no valid selection exists, fall back to your existing automatic selection. Filter the featured entry from your ordinary post grid to avoid duplication. See [examples/homepage.astro](examples/homepage.astro) for a small complete example; adapt its rendering and paths to your theme. Do not replace an existing homepage wholesale.

## Cache and usage

**The plugin does not change or disable homepage caching.** With an existing page cache, visitors may continue to see the previous featured post until that cache expires or is invalidated. A site-specific targeted cache purge after a selection change can be used where supported.

If immediate updates are required, the site owner may choose to disable page caching for the homepage. This increases Worker requests and database reads compared with the same site using a cached homepage, and can increase usage or costs. Review your host's current quotas before changing cache settings. This choice is optional and must be implemented in the site's own cache configuration.

## 繁體中文

在已儲存的文章編輯頁右側，使用「首頁精選文章」區塊指定一篇已發布文章。改選另一篇會取代先前的指定；取消指定後，由首頁依原本的備用規則選文。外掛只保存設定，不改寫文章內容。

這是 EmDash 原生外掛，安裝後仍須依上方範例修改**自己的首頁**，讓首頁讀取指定的文章。預設安裝不會調整首頁快取時間。若希望立即看到精選結果，可選擇不使用首頁頁面快取，但首頁流量與資料庫讀取量會比使用快取時增加，可能影響用量或費用。

## License

MIT. See [LICENSE](LICENSE).
