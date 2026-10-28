# EmDash Featured Post

[English](README.md) | 繁體中文 | [日本語](README.ja.md)

EmDash **原生外掛**，讓你從文章編輯頁指定首頁精選文章。預設上限為 1 篇，管理員可設定為 1 至 20 篇。達到上限時，請先取消其他精選文章，再新增下一篇。

## 相容性與限制

- 已在 EmDash 與 `@emdash-cms/admin` **1.3.1**、Astro、React 和 Cloudflare Workers 環境建置測試。
- 這是可信任的原生外掛，需作為網站套件安裝，不能從 EmDash 的沙盒外掛 registry 安裝。
- 範例假設文章集合為 `posts`、圖片欄位為 `featured_image`、文章網址為 `/posts/<slug>`；請依網站結構調整。
- 文章需先儲存並發布，才能設為精選。精選設定立即儲存，不需要按文章的儲存按鈕。
- 外掛儲存文章 ID 與代稱，不修改文章內容。文章取消發布、刪除或更改代稱後，範例會略過無法取得的文章；若沒有有效精選，則使用最新且有圖片的文章。修改代稱後請重新指定。

## 權限與信任範圍

外掛宣告 `content:read` 以查詢文章；設定精選需要使用者具有 `content:publish_any` 權限。精選資料儲存在外掛自己的設定中，外掛不使用內容寫入 API 修改文章。

原生外掛在網站程序內執行，擁有網站相依套件的權限，**不受沙盒隔離**。宣告的權限用來描述目前使用的 EmDash API，並不限制原生程式碼只能執行這些操作。安裝前請確認信任程式碼來源。

## 安裝

目前尚未發布到 npm，請在 EmDash 網站專案中從 GitHub 安裝：

```sh
npm install github:joyce5438/emdash-Featured-Post
```

在 `astro.config.mjs` 中匯入外掛，加入現有 EmDash 的 `plugins` 陣列：

```js
import { featuredPostPlugin } from "emdash-featured-post";

// 在 emdash({ ... }) 中：
plugins: [
  featuredPostPlugin(),
  // ...其他外掛
],
```

重新建置並部署。**外掛不會自動修改首頁**；請依下方說明接入。

## 設定與首頁整合

在後台外掛選單開啟「首頁精選文章」，設定數量上限。要降低上限時，如果目前已選文章超過新上限，請先取消多出的文章。設定頁可查看文章標題與代稱並取消精選，也能移除已刪除文章的紀錄。

首頁需使用 `getPluginSettings("home-featured")` 讀取 `state.selected` 與 `state.limit`，再使用 `getEmDashEntry` 取得已發布文章並確認 ID，最後以網站自己的版型呈現。沒有有效精選時可沿用原有自動選文邏輯，並從一般文章列表排除精選文章以避免重複。請參考 [examples/homepage.astro](examples/homepage.astro)，依自己的版型調整，不要直接覆蓋原本首頁。

**從 0.1 升級：**舊版指定的文章會保留。首頁也要更新為讀取 `state`，僅在 `state` 不存在時讀取舊版 `selected`；若仍只讀取舊設定，將無法反映升級後的選取變更。多篇精選也需要首頁版型支援。

## 快取與用量

**外掛預設不會變更或關閉首頁快取。**使用頁面快取時，訪客可能需要等快取到期或清除後，才會看到新的精選文章。若網站支援，也可選擇在更新後清除指定頁面的快取。

若希望立即看到更新，站主可自行選擇關閉首頁頁面快取；但首頁請求與資料庫讀取量會比使用快取時增加，可能影響用量或費用。這是選用項目，需在網站自己的快取設定中處理。

## 授權

MIT，詳見 [LICENSE](LICENSE)。
