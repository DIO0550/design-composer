#!/usr/bin/env python3
"""doc コメントの付いていない宣言を探す。

`rules/coding.md`「コメントは doc と Why / Why not に絞る」の 1 つ目
（doc としての説明 — その関数・型・定数が何か、引数、戻り値）を機械で確かめる
ためのもの。

**偽陽性を出さないために対象を絞っている**（`.claude/hooks/README.md`
「例外(エスケープハッチ)」が記録している、誤検知でフックが信用を失う失敗を避ける）。

- `src/` の実装ファイルだけ（`__tests__/` / `*.stories.*` / `__stories__/` は対象外）
- **ファイル直下の宣言だけ**（入れ子の関数・オブジェクトのメソッドは見ない）
- 同じファイルに**同名の宣言があってそちらに doc があれば対象外**
  （型とコンパニオンオブジェクトが doc を共有する、このリポジトリの形を弾かないため）

使い方:
    missing-doc-comments.py <検査するファイル>   # そのファイルの分だけ
    missing-doc-comments.py --all [ルート]        # 全体（既定のルートは src）

見つかれば標準出力へ報告して終了コード 1、無ければ何も出さず 0。
"""

import re
import sys
from pathlib import Path

# ファイル直下の関数宣言（export の有無を問わない）。
# レビュー指摘（PR #157）の `canvasDock` は export されていないので、export だけでは届かない。
TOP_LEVEL_FUNCTION = re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)")

# 公開 API。型・コンパニオンオブジェクト・定数を含む。
EXPORTED_DECLARATION = re.compile(
    r"^export\s+(?:async\s+)?(?:function|const|type|interface)\s+([A-Za-z_$][\w$]*)"
)

# 対象にする宣言。狭めたいときはここから外す（README.md の表と揃えること）。
PATTERNS = (TOP_LEVEL_FUNCTION, EXPORTED_DECLARATION)

SKIP_PARTS = ("__tests__", "__stories__")

# 報告が長くなると読まれないので、先頭からこの件数までを出して残りは件数だけ添える。
MAX_REPORTED = 10


def is_target(path: Path) -> bool:
    if path.suffix not in (".ts", ".tsx"):
        return False
    if any(part in SKIP_PARTS for part in path.parts):
        return False
    return ".stories." not in path.name


def preceding_line(lines: list[str], index: int) -> str:
    """空行を飛ばして 1 つ上の行を返す。無ければ空文字。"""
    for j in range(index - 1, -1, -1):
        if lines[j].strip():
            return lines[j].strip()
    return ""


def undocumented(path: Path) -> list[tuple[int, str]]:
    """doc の付いていない宣言を (行番号, 名前) で返す。"""
    lines = path.read_text(encoding="utf-8").split("\n")
    documented: set[str] = set()
    candidates: list[tuple[int, str]] = []

    for i, line in enumerate(lines):
        matched = next((m for m in (p.match(line) for p in PATTERNS) if m), None)
        if not matched:
            continue
        previous = preceding_line(lines, i)
        # `*/` は JSDoc / ブロックコメントの終わり、`//` は行コメント。
        if previous.endswith("*/") or previous.startswith("//"):
            documented.add(matched.group(1))
        else:
            candidates.append((i + 1, matched.group(1)))

    return [(line_no, name) for line_no, name in candidates if name not in documented]


def report(path: Path, found: list[tuple[int, str]]) -> str:
    shown = found[:MAX_REPORTED]
    body = "\n".join(f"  {path}:{line_no} {name}" for line_no, name in shown)
    if len(found) > len(shown):
        body += f"\n  ... 他 {len(found) - len(shown)} 件"
    return body


def check_one(path: Path) -> int:
    if not is_target(path):
        return 0
    found = undocumented(path)
    if not found:
        return 0
    print("doc コメントの無い宣言があります（rules/coding.md「コメントは doc と Why / Why not に絞る」）:")
    print(report(path, found))
    print("その関数・型・定数が何か、引数、戻り値を 1〜2 行で書いてください。")
    print("意図して省くなら、ファイルに `// @doc-comments-ok` を記載します。")
    return 1


def check_all(root: Path) -> int:
    total = 0
    files = 0
    for path in sorted(root.rglob("*.ts*")):
        if not is_target(path):
            continue
        found = undocumented(path)
        if found:
            files += 1
            total += len(found)
            print(report(path, found))
    print(f"doc コメントの無い宣言 {total} 件 / {files} ファイル")
    return 1 if total else 0


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    if args[0] == "--all":
        return check_all(Path(args[1]) if len(args) > 1 else Path("src"))
    return check_one(Path(args[0]))


if __name__ == "__main__":
    sys.exit(main())
