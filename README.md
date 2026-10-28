# EmDash Featured Post

An EmDash **native plugin** for choosing one or more featured posts on your homepage. The selection control appears in an expanded section of an existing post's editor. A site administrator can choose a limit from 1 to 20; once full, remove an existing selection before adding another. Clearing all selections lets your homepage use its own fallback.

## Compatibility and requirements

- Tested with EmDash and `@emdash-cms/admin` **1.3.1**, Astro, React and Cloudflare Workers.
- This is a trusted native plugin, not a sandboxed plugin. Install it as a site dependency; it cannot be installed from the EmDash sandboxed-plugin registry.
- The examples assume the collection slug is `posts`, the image field is `featured_image`, and post URLs use `/posts/<slug>`. Adapt the homepage code to your site's schema and routes.
- The editor panel appears after an entry has been saved. Only published posts can be selected. The operation is saved immediately, independently of the article Save button.
- The plugin stores selected post IDs and slugs in plugin settings; it does not modify article content. If a selected post is unpublished, deleted, or its slug changes, the example skips unavailable selections and falls back to the latest post with an image when none remain. After changing a slug, select the post again.

## Access and trust

The plugin declares `content:read` to look up posts. Its selection route requires the caller to have the EmDash `content:publish_any` permission, and the selected post is stored in the plugin's settings. It does not use content-writing APIs to edit posts.

This is trusted native code running inside the site process, with the authority of a site dependency. The declared capability describes the EmDash context API used by this implementation; it is **not a sandbox security boundary**. Review the code and only install native plugins you trust.

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

## Settings

Open **首頁精選文章** in the EmDash plugin menu and set the maximum to an integer from 1 to 20 (default: 1). The site template determines the actual layout and must be updated to render multiple entries. If reducing the limit below the number already selected, remove enough selected posts first.

The settings page also lists selected slugs and allows removal, including when a post has been deleted. Selection is saved as soon as you use the editor control; homepage caches are unaffected.

**Upgrading from 0.1:** update the homepage integration to read the new `state` setting and fall back to the old `selected` setting only when `state` does not exist. The old selection is retained, but a homepage that keeps reading only `selected` will not reflect subsequent changes. See the example below.

## Homepage integration

Use `getPluginSettings("home-featured")` to read `state.selected` and `state.limit`, retrieve each published entry with `getEmDashEntry`, verify its ID, then render the entries in your featured area. For upgrades from version 0.1, read the legacy `selected` value when `state` is absent. If no valid selection exists, fall back to your existing automatic selection. Filter the featured entry from your ordinary post grid to avoid duplication. See [examples/homepage.astro](examples/homepage.astro) for a small complete example; adapt its rendering and paths to your theme. Do not replace an existing homepage wholesale.

## Cache and usage

**The plugin does not change or disable homepage caching.** With an existing page cache, visitors may continue to see the previous featured post until that cache expires or is invalidated. A site-specific targeted cache purge after a selection change can be used where supported.

If immediate updates are required, the site owner may choose to disable page caching for the homepage. This increases Worker requests and database reads compared with the same site using a cached homepage, and can increase usage or costs. Review your host's current quotas before changing cache settings. This choice is optional and must be implemented in the site's own cache configuration.

## 繁體中文

在已儲存的文章編輯頁右側，使用「首頁精選文章」區塊指定一篇已發布文章。預設最多一篇，管理員可在外掛設定頁調整為 1 至 20 篇；達到上限時，須先取消其他文章。全部取消後，由首頁依原本的備用規則選文。升級時保留原本指定的文章。外掛只保存設定，不改寫文章內容。

這是 EmDash 原生外掛，安裝後仍須依上方範例修改**自己的首頁**，讓首頁讀取指定的文章。預設安裝不會調整首頁快取時間。若希望立即看到精選結果，可選擇不使用首頁頁面快取，但首頁流量與資料庫讀取量會比使用快取時增加，可能影響用量或費用。

從 0.1 升級時，首頁也要更新為讀取 `state`，並在該設定不存在時讀取舊版 `selected`；只讀舊版設定的首頁無法反映升級後的選取變更。設定頁可取消既有精選，即使該文章已刪除也能移除其紀錄。

外掛使用 `content:read` 查詢文章，精選設定保存在外掛自己的設定中，不透過內容寫入 API 修改文章。設定精選的操作需要 EmDash 的 `content:publish_any` 權限。原生外掛與網站在同一個程序執行，具有網站相依套件的執行權限，**不受沙盒隔離**；`content:read` 宣告不代表原生程式碼只能存取該權限範圍。安裝前請檢視程式碼並確認信任來源。

## License

MIT. See [LICENSE](LICENSE).
