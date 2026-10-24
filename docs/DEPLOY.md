# 把靈感場架成 GitHub 網頁

這是一個純 HTML / CSS / JavaScript 網站。建議以獨立儲存庫 `frame-lab` 部署。

## 1. 建立儲存庫

你截圖中的 Create a new repository 表單可以這樣填：

| 欄位 | 填寫內容 |
|---|---|
| Owner | Cane3307 |
| Repository name | `frame-lab` |
| Description | 靈感場 FRAME LAB｜繁體中文影音選題與企劃工具。210 種靈感組合、腳本公式、短長影音筆記，從發想到可匯出的拍攝大綱。 |
| Choose visibility | Public |
| Start with a template | No template |
| Add README | Off，成品已附 README |
| Add .gitignore | No .gitignore |
| Add license | 先保持 No license，原型及引用資料另有來源，不替它們設定新的授權 |

按 Create repository。本次交付提供本機成品，尚未替你建立或推送遠端儲存庫。

## 2. 上傳成品

儲存庫建立後，選 **uploading an existing file** 或 **Add file → Upload files**。

打開本機的 `short-video-lab` 專案資料夾。請上傳**這一層裡面的檔案與子資料夾**，不要再包一層外層的 `short-video-lab`：

```text
frame-lab（GitHub 儲存庫根目錄）
├── index.html      ← 必須直接看得到這個檔案
├── styles.css
├── app.js
├── assets/
├── data/
├── docs/
├── README.md
└── …其餘檔案
```

直接拖曳整層內容時，瀏覽器可能不含隱藏的 `.nojekyll`。可在 GitHub 的 Add file → Create new file 新增空白 `.nojekyll`。靜態頁面不需要填寫任何密鑰。

完成後填入提交訊息 `Initial FRAME LAB website`，按 Commit changes。若網頁上傳遇到大量檔案限制，可以分批上傳，或用 GitHub Desktop 的 Add existing repository / Publish repository 操作。必要網站檔案只有 `index.html`、`styles.css`、`app.js`、`assets/`、`data/` 與 `.nojekyll`；其餘是維護與說明資料，建議一起保留。

## 3. 啟用 Pages

1. 在這個儲存庫開啟 **Settings**。
2. 左側選 **Pages**。
3. 在 Build and deployment 的 Source 選 **Deploy from a branch**。
4. Branch 選 **main**，資料夾選 **/ (root)**。
5. 按 **Save**。
6. 到 **Actions** 查看 Pages build and deployment，等它顯示成功。
7. 回 Pages 頁點開網站網址。

若帳號是 `Cane3307`、儲存庫名稱是 `frame-lab`，網址預期是：

```text
https://Cane3307.github.io/frame-lab/
```

以 Pages 設定頁實際顯示的網址為準。GitHub 官方說明：[設定發布來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[建立 Pages 網站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。查核日期：2026-10-24。

## 4. 如果打不開

- 出現 404：檢查 `index.html` 是否在 `main` 根目錄，且檔名完全小寫；確認 Actions 已完成。
- 只有 README：通常是首頁不在發布根目錄，請把網站檔案移到根目錄。
- 版面沒有樣式：檢查 `styles.css`、`app.js`、`data/`、`assets/` 都已上傳，大小寫與本機一致。
- Pages 的 main 選不到：先上傳並 Commit 至 main。
- 更新沒出現：確認最新提交的部署完成，再重新整理或清除該頁快取。

## 5. 上線後如何更新

編輯原始 HTML / CSS / JS 後重新上傳同名檔案並 Commit，GitHub Pages 會重新部署。頁面不需要建置指令。

收藏與企劃放在**每個訪客自己的瀏覽器**，網站擁有者不會收到這些內容。不同裝置要靠 JSON 備份轉移。從本機檔案開啟改成 GitHub 網址時，也請先備份再還原。
