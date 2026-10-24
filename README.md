# 靈感場 FRAME LAB

把一點靈感，變成下一個好故事。繁體中文的影音選題器、靈感資料庫與企劃工作紙，開啟 `index.html` 就能用。

![靈感場桌機預覽](docs/screenshots/preview.png)

## 建立 GitHub 儲存庫時可直接填入

**Repository name**

```text
frame-lab
```

**Description**

```text
靈感場 FRAME LAB｜繁體中文影音選題與企劃工具。210 種靈感組合、腳本公式、短長影音筆記，從發想到可匯出的拍攝大綱。
```

選 Public。將本專案**這一層的內容**上傳到儲存庫根目錄，確保首頁是 `/index.html`。

## 功能

- 搜尋 210 個核心組合；依內容主題、呈現形式、標題切角篩選。
- 可鎖定任意條件抽選，抽選結果與編輯中的企劃分開。
- 每個組合有公式、加強點、拍攝建議與兩則完整教學範例。
- 12 種通用公式、31 種混搭配方，共保留 506 則教學示例。
- 12 則附官方來源的短影音、長影音與長片轉短片筆記。
- 工作紙可填企劃名稱、觀眾、目標、素材、開場、大綱、查證與拍攝筆記。
- 短片與長片結構提示、可點選的敘事節奏預覽。
- 本機收藏、自動儲存草稿、最多 100 份企劃版本。
- Markdown 企劃匯出、AI 協作提示複製、JSON 備份與還原。
- 手機版、鍵盤操作、減少動態偏好。

## 使用

1. 在靈感資料庫選擇主題，或直接抽選。
2. 開啟組合看完整範例，按「套入企劃工作紙」。
3. 填入你真正擁有的素材、觀眾、題材與大綱。
4. 按「存入我的企劃」保存版本，或匯出 Markdown。
5. 在「我的收藏 → 資料管理」匯出或匯入 JSON 備份，桌機與手機使用同一入口。

所有內容在瀏覽器執行，不需要帳號、API key、後端、npm 安裝或建置。初次載入後不會呼叫生成式 AI；「AI 協作提示」只是依工作紙整理提示詞，供你貼到自己的 AI 工具。

本機儲存依瀏覽器及網站來源區分，切換裝置、瀏覽器、網址或從 `file://` 改用網站不會自動同步。請先匯出 JSON 再匯入。隱私模式、清除網站資料或容量不足可能影響保存；遇到儲存失敗會顯示提示，仍可匯出。託管完成後首次造訪需要網路；這版沒有安裝式 PWA 或離線快取。

## GitHub Pages

在儲存庫 `Settings → Pages`，設定：

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

按 Save。部署成功後，若儲存庫名為 `frame-lab`，預期網址為 `https://Cane3307.github.io/frame-lab/`。實際網址請以 Pages 顯示為準。完整圖文操作見 [架設指南](docs/DEPLOY.md)。

## 專案大綱

```text
index.html             頁面與語意表單
styles.css             紙面／墨綠視覺、響應式、動態
app.js                 搜尋、抽選、工作紙、儲存與匯出
assets/favicon.svg     原創向量識別
data/catalog.js        完整原型資料，classic script 可直接開啟
data/knowledge.js      12 則官方來源筆記
docs/                  設計、研究、驗收、部署說明與截圖
short-video-lab/       原始技能包，保留不修改
scripts/build-catalog.py  從原始 JSON 再生網頁資料
tests/smoke.cjs        真實 Chromium 操作驗收
.nojekyll              GitHub Pages 靜態發布標記
```

原型資料與總報告保留原貌，方便後續維護。修改原資料後，可執行 `python scripts/build-catalog.py` 再產生前端資料。核心頁面只有相對路徑，可部署到 GitHub Pages 的 repository 子路徑。

## 內容與來源

210 是原型的編目範圍，並非創意的總數。全部範例都是虛構教學，不能直接當成你的實績、測試、顧客回饋或真實經歷。工具不承諾流量或成交。長片時間分配是可修改的企劃起點，並非平台規定。

研究來源與長短片差異見 [RESEARCH](docs/RESEARCH.md)。視覺互動參考 [Skillry 公開作品集](https://skillry.dev/ai-videos/opus-5-5)，採用重新設計的工作紙與拍板語彙，未複製其付費技能。原型所附第三方資料的授權以各原來源為準，專案不替使用者素材新增授權。

## 驗收

執行 `node tests/smoke.cjs`。測試需要 Playwright 與可用 Chromium，與網站本身的使用無關。可用環境變數 `PLAYWRIGHT_MODULE`、`PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定測試環境；Codex 桌機內會嘗試使用其既有套件與快取瀏覽器。

測試涵蓋 GitHub 子路徑、file 開啟、抽選、草稿、匯出還原、鍵盤、手機與減少動態。結果存於 [TEST_RESULTS.json](docs/TEST_RESULTS.json)，詳見 [驗收報告](docs/ACCEPTANCE.md)。
