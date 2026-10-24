# 靈感場驗收

日期：2026-10-24。範圍：精簡首頁、固定抽卡位置及 1／3／5 張抽選。

## 結果

以 Chromium 執行 tests/smoke.cjs，10 組操作檢查全部通過，沒有 JavaScript 錯誤或本機資源載入失敗。結果見 [TEST_RESULTS.json](TEST_RESULTS.json)。

| 項目 | 實際結果 |
|---|---|
| 資料 | 210 張唯一且完整的卡片；主要導航只有翻卡和全部卡片；無漸層 |
| 精簡首頁 | 移除標語和介紹段落，保留張數、翻卡按鈕和卡片 |
| 原位翻卡 | 抽卡前後使用同一個卡片節點，更新內容並重播翻轉 |
| 張數 | 1、3、5 張均數量正確，同批不重複；下一批排除上一批 |
| 位置穩定 | 量測連續抽卡前後的按鈕座標及 scrollY，確認不變 |
| 手機連抽 | 捲到第五張時，控制列保持置頂；再次抽卡不改變按鈕座標或捲動位置 |
| 詳情返回 | 保留整批結果；列表搜尋、主題篩選和返回卡片焦點正常 |
| 複製 | 檢查實際剪貼簿文字；無權限時提供可選取文字 |
| 響應式 | 320、360、390、768、1024、1440px 下各頁面無水平溢位 |
| 相容性 | 減少動態、鍵盤、repository 子路徑和直接開啟 HTML 都正常 |

## 視覺紀錄

- [桌機封面](screenshots/preview.png)
- [一次抽三張](screenshots/batch-3-desktop.png)
- [一次抽五張](screenshots/batch-5-desktop.png)
- [手機抽卡](screenshots/doodle-drawn-mobile.png)
- [全部卡片](screenshots/doodle-cards-desktop.png)

原生 iOS Safari、Android 裝置及完整螢幕閱讀器操作未在本次實機驗證。
