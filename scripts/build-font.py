"""Build the self-hosted notebook display font from the official OFL source."""
from pathlib import Path
from urllib.request import urlopen
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT.parent / 'frame-lab-maintainer-notes' / 'font-source'
DEST = ROOT / 'assets' / 'fonts'
UPSTREAM = 'https://raw.githubusercontent.com/google/fonts/main/ofl/lxgwwenkaitc/'
CACHE.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
source = CACHE / 'LXGWWenKaiTC-Regular.ttf'
if not source.exists():
    source.write_bytes(urlopen(UPSTREAM + source.name, timeout=60).read())
license_file = DEST / 'OFL.txt'
if not license_file.exists():
    license_file.write_bytes(urlopen(UPSTREAM + 'OFL.txt', timeout=30).read())
text = ''.join(chr(i) for i in range(32, 256))
for pattern in ('*.html', '*.js'):
    for file in ROOT.rglob(pattern):
        text += file.read_text(encoding='utf-8')
text += '靈感試映稿方向隨手記隨機抽取紙卡導演工作簿翻頁便條提出困惑檢查三件看見改變換一張播放暫停收起重新靈感從哪個念頭開始'
font = TTFont(source)
options = subset.Options()
options.flavor = 'woff2'
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
# The subset is a derivative. Keep the original copyright, rename the family.
for record in font['name'].names:
    if record.nameID in (1, 4, 6, 16):
        new_name = 'FrameWenKai-Regular' if record.nameID == 6 else 'Frame WenKai'
        record.string = new_name.encode(record.getEncoding(), errors='replace')
font.flavor = 'woff2'
destination = DEST / 'frame-wenkai.woff2'
font.save(destination)
print(f'{destination}: {destination.stat().st_size:,} bytes, {len(set(text))} requested characters')
