# FRAME LAB Design System

## Scene and theme

創作者在有自然光的工作桌翻看場記紙，將零散素材整理成下一支影片。採用淺色紙面與深墨綠導覽，減少長時間閱讀負擔。

## Color strategy

Restrained。紙色 oklch(97% .012 85)、墨色 oklch(25% .027 164)、主綠 oklch(35% .055 164)、訊號橘 oklch(55% .17 35)。主內容以紙面與細線組織，橘色只提示抽選、當前節點與個別圖形。

## Typography

Segoe UI、Microsoft JhengHei、PingFang TC 系統字體。標題 32/40px，分區 22/30px，內容 14–16px。英數標記使用等寬字體，正文每行不超過 75ch。

## Layout

桌機左導覽 204px，主內容最大 1540px。選題與預覽依內容安排雙欄；手機導覽改頂部分頁、所有表單單欄。內容卡用於確實可選取的題材，長篇知識採開放閱讀結構。

## Components and states

圓角 8px 按鈕、12px 可選卡、1px 中性分隔線。焦點外框明確。篩選以原生 select 搭配鎖定按鈕；搜尋有清除。儲存與錯誤用 aria-live 告知。工作紙原生 input/textarea。

## Motion

抽選時走帶與卡片翻移使用 transform/opacity，200ms ease-out。腳本節奏預覽依使用者點擊播放。prefers-reduced-motion 下無抽選或平滑捲動；不播放聲音。
