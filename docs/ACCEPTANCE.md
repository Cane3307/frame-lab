# 靈感場驗收

日期：2026-10-24。範圍：簡單塗鴉版完整重設計。

## 結果

以 Chromium 執行 tests/smoke.cjs，8 組操作檢查全部通過。沒有 JavaScript 錯誤或本機資源載入失敗。機器可讀結果見 [TEST_RESULTS.json](TEST_RESULTS.json)。

| 項目 | 實際結果 |
|---|---|
| 內容與畫面 | 210 張唯一且完整的卡片；主要導航只有翻卡和全部卡片；啟用的樣式無漸層 |
| 隨機翻卡 | 封面和主按鈕可翻卡，結果直接列出故事步驟；連續兩張不重複，重複操作保留鍵盤焦點 |
| 頁面切換 | 詳情可回到當前抽卡；翻卡途中換頁取消動畫並解除忙碌狀態 |
| 全部卡片 | 一頁渲染 210 張；編號搜尋、空結果復原及七種主題篩選正常 |
| 卡片詳情 | 兩個範例可展開；返回列表恢復選中的卡片位置和焦點 |
| 複製 | 檢查實際剪貼簿文字；無剪貼簿權限時顯示可手動選取的文字 |
| 手機與桌機 | 320、360、390、768、1024、1440px 的翻卡、列表及詳情均無水平溢位；手機輸入至少 16px |
| 動態與載入 | 減少動態立即顯示結果；repository 子路徑和直接開啟 HTML 都正常 |

## 視覺紀錄

- [桌機封面](screenshots/doodle-cover-desktop.png)
- [桌機抽卡結果](screenshots/doodle-drawn-desktop.png)
- [全部卡片](screenshots/doodle-cards-desktop.png)
- [手機抽卡](screenshots/doodle-drawn-mobile.png)
- [手機詳情](screenshots/doodle-detail-mobile.png)

瀏覽器操作檢查使用 Chromium。原生 iOS Safari、Android 裝置及完整螢幕閱讀器操作未在本次實機驗證。
