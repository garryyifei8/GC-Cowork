#!/usr/bin/env python3
"""Generate sample test files for verifying file upload/preview/download.

Uses only Python stdlib — no external dependencies required.

Usage:
    python scripts/create_test_files.py
"""

import io
import struct
import zlib
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "test_files"


# ---------------------------------------------------------------------------
# 1. PNG — 100x100 red square
# ---------------------------------------------------------------------------
def create_png(path: Path) -> None:
    """Create a minimal 100x100 red PNG."""
    width, height = 100, 100

    def make_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk = chunk_type + data
        return struct.pack(">I", len(data)) + chunk + struct.pack(">I", zlib.crc32(chunk) & 0xFFFFFFFF)

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr = make_chunk(b"IHDR", ihdr_data)

    # IDAT — raw image data (filter byte 0 + RGB pixels per row)
    raw_rows = b""
    for _ in range(height):
        raw_rows += b"\x00"  # filter: None
        raw_rows += b"\xe0\x30\x30" * width  # red-ish RGB

    idat = make_chunk(b"IDAT", zlib.compress(raw_rows))
    iend = make_chunk(b"IEND", b"")

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")  # PNG signature
        f.write(ihdr)
        f.write(idat)
        f.write(iend)

    print(f"  PNG: {path} ({path.stat().st_size:,} bytes)")


# ---------------------------------------------------------------------------
# 2. PDF — single page with Chinese text
# ---------------------------------------------------------------------------
def create_pdf(path: Path) -> None:
    """Create a minimal PDF with Chinese text."""
    # Use a simple PDF structure that embeds CIDFont for CJK
    content_stream = b"""\
BT
/F1 24 Tf
50 750 Td
(GC TeamWork Test Document) Tj
0 -40 Td
/F1 14 Tf
(This is a sample PDF for testing file upload and preview.) Tj
0 -30 Td
(Created by create_test_files.py) Tj
ET
"""

    objects: list[bytes] = []
    offsets: list[int] = []

    def add_obj(content: bytes) -> int:
        idx = len(objects) + 1
        objects.append(content)
        return idx

    # 1 - Catalog
    add_obj(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2 - Pages
    add_obj(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    # 3 - Page
    add_obj(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"
    )
    # 4 - Content stream
    stream_data = content_stream
    add_obj(
        b"<< /Length " + str(len(stream_data)).encode() + b" >>\nstream\n"
        + stream_data + b"\nendstream"
    )
    # 5 - Font
    add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    buf = io.BytesIO()
    buf.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    for i, obj in enumerate(objects):
        offsets.append(buf.tell())
        buf.write(f"{i + 1} 0 obj\n".encode())
        buf.write(obj)
        buf.write(b"\nendobj\n")

    xref_offset = buf.tell()
    buf.write(b"xref\n")
    buf.write(f"0 {len(objects) + 1}\n".encode())
    buf.write(b"0000000000 65535 f \n")
    for off in offsets:
        buf.write(f"{off:010d} 00000 n \n".encode())

    buf.write(b"trailer\n")
    buf.write(f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode())
    buf.write(b"startxref\n")
    buf.write(f"{xref_offset}\n".encode())
    buf.write(b"%%EOF\n")

    path.write_bytes(buf.getvalue())
    print(f"  PDF: {path} ({path.stat().st_size:,} bytes)")


# ---------------------------------------------------------------------------
# 3. DOCX — single paragraph
# ---------------------------------------------------------------------------
def create_docx(path: Path) -> None:
    """Create a minimal DOCX with Chinese text."""
    import zipfile

    content_types = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

    rels = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    word_rels = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>"""

    document = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>GC TeamWork 测试文档</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>这是一个用于测试文件上传和在线预览功能的示例 Word 文档。</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>项目名称：博物馆EPC项目</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>文档类型：测试文件</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>创建工具：create_test_files.py</w:t></w:r>
    </w:p>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/_rels/document.xml.rels", word_rels)
        zf.writestr("word/document.xml", document)

    print(f"  DOCX: {path} ({path.stat().st_size:,} bytes)")


# ---------------------------------------------------------------------------
# 4. XLSX — simple spreadsheet
# ---------------------------------------------------------------------------
def create_xlsx(path: Path) -> None:
    """Create a minimal XLSX with sample project data."""
    import zipfile

    content_types = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>"""

    rels = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

    workbook_rels = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>"""

    workbook = """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="项目数据" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>"""

    strings = [
        "项目名称", "阶段", "进度", "预算(万)",
        "博物馆EPC项目", "施工", "65%", "12000",
        "信息化二期项目", "开发", "40%", "450",
        "智慧园区咨询", "立项", "15%", "80",
    ]
    si_xml = "\n".join(f'  <si><t>{s}</t></si>' for s in strings)
    shared_strings = f"""\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(strings)}" uniqueCount="{len(strings)}">
{si_xml}
</sst>"""

    # Build sheet with shared string references
    rows = []
    for r in range(4):  # 4 rows (header + 3 data)
        cells = []
        for c in range(4):
            idx = r * 4 + c
            col_letter = chr(65 + c)
            cells.append(f'<c r="{col_letter}{r + 1}" t="s"><v>{idx}</v></c>')
        rows.append(f'<row r="{r + 1}">{"".join(cells)}</row>')

    sheet = f"""\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    {"".join(rows)}
  </sheetData>
</worksheet>"""

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        zf.writestr("xl/workbook.xml", workbook)
        zf.writestr("xl/worksheets/sheet1.xml", sheet)
        zf.writestr("xl/sharedStrings.xml", shared_strings)

    print(f"  XLSX: {path} ({path.stat().st_size:,} bytes)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Creating test files in {OUTPUT_DIR}/")

    create_png(OUTPUT_DIR / "sample.png")
    create_pdf(OUTPUT_DIR / "sample.pdf")
    create_docx(OUTPUT_DIR / "sample.docx")
    create_xlsx(OUTPUT_DIR / "sample.xlsx")

    print("\nDone! Files ready for upload testing.")


if __name__ == "__main__":
    main()
