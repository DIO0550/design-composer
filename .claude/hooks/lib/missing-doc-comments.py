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

doc がある関数については、`rules/coding.md`「doc に書く項目」も見る。

- 名前付きの引数があるのに `@param` が無い（分割代入だけの引数は対象外。名前が無く
  `@param` を付けられないため）
- `void` 以外を返すのに `@returns` が無い
- 本体に `throw` があるのに `@throws` が無い

使い方:
    missing-doc-comments.py <検査するファイル>              # doc の有無と項目の両方
    missing-doc-comments.py --missing-only <検査するファイル>  # doc の有無だけ
    missing-doc-comments.py --all [ルート]                   # 全体（既定のルートは src）

`--missing-only` は push 前の検査で使う。項目（`@param` / `@returns` / `@throws`）の
検査は既存の doc 190 件に及ぶため、埋め終わるまで push を止めない
（`.claude/hooks/README.md`「例外(エスケープハッチ)」）。

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

# 引数の並びと戻り値の型を取り出すための、宣言の始まり。
FUNCTION_SIGNATURE = re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*")

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


def signature_of(lines: list[str], index: int) -> str:
    """宣言の始まりから、引数を閉じる `)` の後ろまでを 1 行に潰して返す。"""
    depth = 0
    buffer: list[str] = []
    for line in lines[index : index + 60]:
        buffer.append(line)
        depth += line.count("(") - line.count(")")
        joined = " ".join(buffer)
        if depth == 0 and "(" in joined:
            return joined[joined.find("(") :]
    return ""


def parameter_names(signature: str) -> list[str]:
    """名前付きの引数の名前。分割代入は名前が無いので含めない。"""
    inner = signature[1 : signature.rfind(")")] if ")" in signature else ""
    if not inner.strip() or inner.lstrip().startswith("{"):
        return []
    names: list[str] = []
    depth = 0
    current = ""
    for ch in inner:
        if ch in "<([{":
            depth += 1
        elif ch in ">)]}":
            depth -= 1
        if ch == "," and depth == 0:
            names.append(current)
            current = ""
            continue
        current += ch
    names.append(current)
    return [n for n in (re.sub(r"[?:].*$", "", n).strip() for n in names) if n]


def missing_doc_items(lines: list[str], index: int, doc: str) -> list[str]:
    """`rules/coding.md`「doc に書く項目」のうち、その関数の doc に無いもの。"""
    signature = signature_of(lines, index)
    if not signature:
        return []
    missing: list[str] = []
    if parameter_names(signature) and "@param" not in doc:
        missing.append("@param")
    returns = signature[signature.rfind(")") + 1 :]
    returns_value = re.search(r":\s*(?!void\b|Promise<void>)\S", returns)
    if returns_value and "@returns" not in doc:
        missing.append("@returns")
    body = "\n".join(lines[index : index + 80])
    if re.search(r"\bthrow\s", body) and "@throws" not in doc:
        missing.append("@throws")
    return missing


def incomplete(path: Path) -> list[tuple[int, str]]:
    """doc はあるが「doc に書く項目」が欠けている関数を (行番号, 説明) で返す。"""
    lines = path.read_text(encoding="utf-8").split("\n")
    found: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        if not FUNCTION_SIGNATURE.match(line):
            continue
        doc = doc_block_above(lines, i)
        if doc is None:
            continue
        missing = missing_doc_items(lines, i, doc)
        if missing:
            name = line.split("function", 1)[1].split("(")[0].strip()
            found.append((i + 1, f"{name} — {' / '.join(missing)} が無い"))
    return found


def doc_block_above(lines: list[str], index: int) -> str | None:
    """宣言の直前の JSDoc ブロック。無ければ None。"""
    j = index - 1
    while j >= 0 and not lines[j].strip():
        j -= 1
    if j < 0 or not lines[j].strip().endswith("*/"):
        return None
    end = j
    while j >= 0 and not lines[j].strip().startswith("/*"):
        j -= 1
    return "\n".join(lines[j : end + 1]) if j >= 0 else None


def report(path: Path, found: list[tuple[int, str]]) -> str:
    shown = found[:MAX_REPORTED]
    body = "\n".join(f"  {path}:{line_no} {name}" for line_no, name in shown)
    if len(found) > len(shown):
        body += f"\n  ... 他 {len(found) - len(shown)} 件"
    return body


def check_one(path: Path, missing_only: bool = False) -> int:
    if not is_target(path):
        return 0
    missing = undocumented(path)
    partial = [] if missing_only else incomplete(path)
    if not missing and not partial:
        return 0
    print("doc が規約を満たしていません（rules/coding.md「コメントは doc と Why / Why not に絞る」）:")
    if missing:
        print(report(path, missing))
    if partial:
        print(report(path, partial))
    print("その関数・型・定数が何かに加え、引数は @param、戻り値は @returns、投げる例外は @throws を書いてください。")
    print("意図して省くなら、ファイルに `// @doc-comments-ok` を記載します。")
    return 1


def check_all(root: Path) -> int:
    missing_total = 0
    partial_total = 0
    files = 0
    for path in sorted(root.rglob("*.ts*")):
        if not is_target(path):
            continue
        missing = undocumented(path)
        partial = incomplete(path)
        if not missing and not partial:
            continue
        files += 1
        missing_total += len(missing)
        partial_total += len(partial)
        if missing:
            print(report(path, missing))
        if partial:
            print(report(path, partial))
    print(
        f"doc の無い宣言 {missing_total} 件 / 項目が欠けた doc {partial_total} 件 / {files} ファイル"
    )
    return 1 if missing_total or partial_total else 0


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    if args[0] == "--all":
        return check_all(Path(args[1]) if len(args) > 1 else Path("src"))
    if args[0] == "--missing-only":
        if len(args) < 2:
            print(__doc__)
            return 2
        return check_one(Path(args[1]), missing_only=True)
    return check_one(Path(args[0]))


if __name__ == "__main__":
    sys.exit(main())
