"""Create a GitHub-ready archive beside the project. No dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
destination = root.parent / "frame-lab-github-pages.zip"
ignored = {".git", "node_modules", "__pycache__", ".DS_Store"}
with ZipFile(destination, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(root.rglob("*")):
        if file.is_file() and not ignored.intersection(file.relative_to(root).parts):
            archive.write(file, file.relative_to(root).as_posix())
with ZipFile(destination) as archive:
    assert archive.testzip() is None
    for filename in ["index.html", "styles.css", "app.js", "data/catalog.js", ".nojekyll"]:
        assert filename in archive.namelist(), filename
print(f"Created {destination} ({destination.stat().st_size:,} bytes)")
