# 短影音與長影音：研究與資料界線

查核日期：2026-10-24。研究員：Agent OS 領域透鏡。這份文件服務靜態靈感庫；它不宣稱觀看所有案例影片，也不把模板當成流量保證。

## 原型盤點

已讀 `short-video-lab/SKILL.md` 與 `references/07-evidence.md`。原型以七主題、五形式、六標題切角，編出 210 個企劃格；不是全世界創意的總數。七個 `references/catalog-*.json` 存完整紀錄；`index.json` 提供索引，另有 `formulas.json` 與 `mixes.json`。`assets/` 目前只有 `icon.svg`。

完整紀錄欄位為 `id, theme, form, headline, template, concept, formula, reinforce[], expected_effects[], presentation[], avoid[], examples[]`；每個範例另有 `scenario, title, copy, shots[], explanation, evidence_status`。原型範例均為虛構教學示例，不可移植成使用者的真實經歷、測試或顧客見證。其公開分類與分析整理也不代表取得原講師全部教材。

## 可用知識與一手來源

1. **短片結構與手機閱讀。** TikTok 的廣告建議包含開頭、主體、結尾、直式與安全區。這是廣告實務起點，不能推論一般內容必然有效，也不把其秒數建議當演算法定律。[TikTok Creative best practices](https://ads.tiktok.com/resources/help/article/creative-best-practices?lang=en)
2. **推薦是多因素的。** Shorts 參考選擇觀看、觀看時間與比例、滿意度，也受需求、競爭及季節影響；官方沒有最低發片頻率要求。[YouTube Shorts 搜尋與探索](https://support.google.com/youtube/answer/11914225?co=YOUTUBE._YTVideoType%3Dshorts&hl=en)
3. **標題縮圖是觀看前的資訊。** 標題應準確簡潔，依觀眾情境選搜尋導向或好奇導向，並檢查不同裝置顯示。[YouTube Thumbnail & title tips](https://support.google.com/youtube/answer/12340300?hl=en)
4. **留存需回看內容。** 開頭報告觀察前 30 秒；尖峰可能代表重看、分享或不清楚，低谷可能是跳過或離開。重要時刻能作延伸選題線索。[YouTube Audience retention](https://support.google.com/youtube/answer/9314415?hl=en)
5. **長片章節提供定位。** 手動章節從 00:00 起、至少三個時間戳記、每章至少 10 秒；可用性受頻道權限等條件影響。[YouTube Video Chapters](https://support.google.com/youtube/answer/9884579?hl=en)
6. **切自己的長片有特定功能。** Edit into a Short 目前選取最多 60 秒，限自己已公開且合資格的影片，並連回原片。不要與一般 Shorts 上傳規格混為一談。[YouTube Create Shorts from your videos](https://support.google.com/youtube/answer/12836917?hl=en)
7. **短片可以安排後續深度內容。** Related Video 需進階功能權限，目標影片須公開或不公開。[YouTube Add a related video](https://support.google.com/youtube/answer/14075157?hl=en)
8. **再剪輯仍要核對素材。** 外部製作後上傳的 Shorts 也須有受版權保護素材的使用權利。[YouTube Upload Shorts](https://support.google.com/youtube/answer/12779649?hl=en)
9. **帳號自身的提示更有針對性。** Instagram Best Practices 位於專業主控板，涵蓋創作、互動、觸及、營利、規範與個人化建議。[Meta 官方介紹](https://about.fb.com/news/2024/10/best-practices-education-hub-creators-instagram/)

## 長短片的工作差異

以下是本工具對上述來源及本地原型的企劃推導，並非平台公布的互斥分類。

| 維度 | 短影音工作重點 | 長影音工作重點 |
|---|---|---|
| 承諾 | 選一個可獨立交付的小問題 | 用主問題串起多個子問題 |
| 背景 | 補足單獨觀看需要的最少背景 | 漸進建立條件、例外與比較 |
| 證據 | 保留最能支持結論的示範 | 展開方法、過程與適用邊界 |
| 導覽 | 第一畫面與第一句快速指向價值 | 標題縮圖、開頭與章節相互對齊 |
| 檢視 | 分辨沒停下與中途流失 | 檢查段落留存及觀眾期待 |

## 長片變短片的建議流程

1. 列出原片子問題與時間碼，標記重要時刻、具體示範與完整答案。
2. 選一個能獨立理解的單元，寫出短片要兌現的承諾。
3. 核對原意、成立條件、來源與素材權利；不只抽取刺激結論。
4. 重排必要背景、示範及收束，調整直式構圖與字幕安全區。
5. 讓短片先交付，再提供合理的下一步；使用相關影片功能時檢查資格。
6. 以自己的觀眾資料回看成效，先記錄假設，再改一個主要變因。

## 網頁知識資料契約

`data/knowledge.js` 提供 `window.LAB_KNOWLEDGE`，共 12 筆。`kind` 為 `short`、`long`、`repurpose`，各四筆；每筆有 `id, title, kind, summary, steps: string[], source: { title, url }`。`summary` 陳述來源可支持的資訊及必要邊界，`steps` 是本工具的操作建議。介面應顯示來源連結，且不要將知識卡標為官方認證。

規格與功能可能更新，實際發布前需以各平台當期介面及官方文件為準。沒有查核通用最佳秒數、固定爆紅門檻或模板成功率，因此工具不應顯示此類分數。
