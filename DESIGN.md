# FRAME LAB Notebook Design System

## Physical scene

一位創作者攤開工作簿，左頁整理方向，右頁接住一張可以開始拍攝的靈感。整張跨頁承擔空間、材質與功能，頁面上緣的章節索引取代側欄。

## Art direction

- 雙頁書溝、薄頁疊、紙面細紋、低對比藍灰規線。
- 藍黑筆墨、朱紅手改與印章、暖灰桌面；正文和控制使用系統 sans。
- 標題與旁註使用本機託管的 Frame WenKai，為 LXGW WenKai TC 的改名子集，保留 OFL。
- 原創 SVG 筆畫負責七種主題的敘事草圖，不使用影片截圖充當可拍素材。
- 索引卡提供範例題名與可辨識的故事結構，避免所有項目只呈現方括號模板。

## Actual references and translation

- MotionIn Console：原生按鈕的短行程、底邊收短、按下即有結果，轉成朱紅印章式主按鈕。
- MotionIn Hardback：書本厚度與物件連續性，轉成跨頁紙面、頁邊與同一張紙卡抽出後落位。
- Skillry 作品庫：先看效果，再讀內容；轉成右頁可點選／可播放的三段敘事試映。
- Skillry @heyiamnick 作品：紙面筆畫延續到下個狀態；轉成 SVG 筆畫與目前段落連動。

參考互動原理，未複製付費提示詞、程式碼、影片或美術資產。研究截圖與維護筆記保存在公開專案之外。

## Signature interaction

抽卡前立即確定候選資料。舊卡短距離退場，440ms 內新卡入場；每次使用不同的出場／入場 animation，連續抽選會重播。中途換頁、修改條件或隱藏分頁會取消未完成的抽選。

三個敘事段落可各別點選，或依序播放；目前筆畫、文字與螢幕閱讀器狀態同時更新。換題材會更換草圖與說明。

## Motion and accessibility

按鈕 90–180ms，選取 180–220ms，紙卡入場 420ms。使用 transform／opacity／SVG stroke。無聲音、不自動播放故事。reduced-motion 完全取消位移與筆畫動態，保留立即的文字與顏色狀態。

章節、紙卡與按鈕維持原生鍵盤操作與明確焦點。手機改為連續單頁，輸入字級至少 16px。

## Files

index.html：跨頁、章節與工作紙語意結構。
styles.css：共用基礎與功能畫面。
notebook.css：完整筆記美術與動態。
app.js：資料、抽選與敘事試映狀態。
assets/fonts/：字型子集與授權。
