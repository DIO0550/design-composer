#!/usr/bin/env python3
"""doc コメントの付いていない宣言を探す。

`rules/coding.md`「コメントは doc と Why / Why not に絞る」の 1 つ目
（doc としての説明 — その関数・型・定数が何か、引数、戻り値）を機械で確かめる
ためのもの。

**偽陽性を出さないために対象を絞っている**（`.claude/hooks/README.md`
「例外(エスケープハッチ)」が記録している、誤検知でフックが信用を失う失敗を避ける）。

- `src/` の実装ファイルだけ（`__tests__/` / `*.stories.*` / `__stories__/` は対象外）
- **ファイル直下の宣言だけ**（入れ子の関数・オブジェクトのメソッドは見ない）。
  `--include-methods` を付けたときだけ、コンパニオンオブジェクトの直下のメソッドも見る
  （それより深い入れ子は見ない）
- 同じファイルに**同名の宣言があってそちらに doc があれば対象外**
  （型とコンパニオンオブジェクトが doc を共有する、このリポジトリの形を弾かないため）

コンパニオンオブジェクトのメソッドを見るのは、ロジックがそこに集まる形をこのリポジトリが
採っている（`rules/coding.md`「コンパニオンオブジェクトパターン」）ため。ファイル直下だけを
見ていた頃は、`Foo.fromJson` のような公開 API が doc 無しのままレビューまで残った。
既定で見ない理由と外す条件は `.claude/hooks/README.md`「例外(エスケープハッチ)」。

**メソッドと読むのは、`const` で始まるオブジェクトの直下（行頭の空白が 2 つ）にあって、
引数の括弧の後ろに本体（`{` か `=>`）が続くものだけ。** `type` / `interface` の型リテラルは
オブジェクトとして読まないのでメンバが外れ、対応表（`{ colors: "Color" }`）は引数の括弧が
無いので外れる。Biome の整形（字下げ 2・1 列目の `}` で閉じる）を前提にしている。

doc がある関数については、`rules/coding.md`「doc に書く項目」も見る。

- 名前付きの引数があるのに `@param` が無い（分割代入だけの引数は対象外。名前が無く
  `@param` を付けられないため）
- `void` 以外を返すのに `@returns` が無い
- 本体に `throw` があるのに `@throws` が無い

使い方:
    missing-doc-comments.py <検査するファイル>              # doc の有無と項目の両方
    missing-doc-comments.py --missing-only <検査するファイル>  # doc の有無だけ
    missing-doc-comments.py --all [ルート]                   # 全体（既定のルートは src）
    missing-doc-comments.py --lines <検査するファイル>         # `<行番号>:<名前>` で 1 件 1 行

どの形にも `--include-methods` を足せる（コンパニオンオブジェクトのメソッドも見る。位置は問わない）。
`--lines` は CI が diff の追加行と突き合わせるための機械可読な出力で、doc の有無と項目の
両方を出す（`duplicate-test-helpers.py --lines` と同じ形式。追加行かどうかは呼ぶ側が見る）。

`--missing-only` は doc の有無だけを見たいときに使う。項目の抜けは 0 件にしたので、
push 前の検査は項目まで見ている（`.claude/hooks/README.md`
「例外(エスケープハッチ)」）。

見つかれば標準出力へ報告して終了コード 1、無ければ何も出さず 0。
"""

import re
import sys
from pathlib import Path

# ファイル直下の関数宣言（export の有無を問わない）。
# レビュー指摘のあった `canvasDock` は export されていないので、export だけでは届かない。
TOP_LEVEL_FUNCTION = re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)")

# 公開 API。型・コンパニオンオブジェクト・定数を含む。
EXPORTED_DECLARATION = re.compile(
    r"^export\s+(?:async\s+)?(?:function|const|type|interface)\s+([A-Za-z_$][\w$]*)"
)

# 対象にする宣言。狭めたいときはここから外す（README.md の表と揃えること）。
PATTERNS = (TOP_LEVEL_FUNCTION, EXPORTED_DECLARATION)

# コンパニオンオブジェクトの始まり（`export const Foo = {` / `const Foo: T = {`）。
COMPANION_START = re.compile(
    r"^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*\{\s*$"
)

# その閉じ。Biome が整形したオブジェクトは 1 列目の `}` で閉じる。波括弧を数えないのは、
# 文字列・テンプレートリテラルの中の `{` `}` で深さがずれ、閉じた後ろまで取りこぼすため。
COMPANION_END = re.compile(r"^\}")

# その直下のメソッド(行頭がちょうど 2 つの空白。それより深い入れ子は外れる)。`name(` のメソッド記法と、`name: (` の関数プロパティの両方。
COMPANION_METHOD = re.compile(
    r"^  (?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:[(<]|:\s*(?:async\s*)?[(<])"
)

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


def declarations(lines: list[str], include_methods: bool) -> list[tuple[int, str]]:
    """doc を求める宣言を (行番号(0 始まり), 名前) で返す。

    `undocumented` と `incomplete` が同じ列挙を見るよう、対象の定義はここ 1 箇所に置く。

    @param lines ファイル全体の行
    @param include_methods コンパニオンオブジェクトの直下のメソッドも含めるか
    @returns 宣言の行番号と名前。メソッドは `Owner.method` の綴りで返す
    """
    found: list[tuple[int, str]] = []
    owner: str | None = None
    for i, line in enumerate(lines):
        if owner is None:
            matched = next((m for m in (p.match(line) for p in PATTERNS) if m), None)
            if matched:
                found.append((i, matched.group(1)))
            start = COMPANION_START.match(line) if include_methods else None
            if start:
                owner = start.group(1)
            continue
        if COMPANION_END.match(line):
            owner = None
            continue
        method = COMPANION_METHOD.match(line)
        if method and has_body(lines, i):
            found.append((i, f"{owner}.{method.group(1)}"))
    return found


def has_body(lines: list[str], index: int) -> bool:
    """引数を閉じる `)` の後ろに本体(`{` か `=>`)が続くか。

    行末の `{` で見ないのは、改行されたシグネチャ(`  create(` で行が終わる形)と
    式本体のアロー関数(`  bar: (x) => x + 1,`)を取りこぼすため。

    @param lines ファイル全体の行
    @param index メソッドの始まりの行番号(0 始まり)
    @returns 本体を持つなら True。値が括弧で始まるだけのプロパティ(`a: (b + c) * 2,`)は False
    """
    signature = signature_of(lines, index)
    rest = signature[closing_paren(signature) + 1 :]
    return "{" in rest or "=>" in rest


def closing_paren(signature: str) -> int:
    """先頭の `(` に対応する `)` の位置。

    最後の `)` で見ないのは、本体の中の括弧(`=> Math.abs(x)`)の後ろを見てしまうため。

    @param signature `(` で始まるシグネチャ(`signature_of` の戻り値)
    @returns 対応する `)` の位置。閉じていなければ末尾の位置
    """
    depth = 0
    for position, ch in enumerate(signature):
        depth += {"(": 1, ")": -1}.get(ch, 0)
        if depth == 0:
            return position
    return len(signature) - 1


def undocumented(path: Path, include_methods: bool = False) -> list[tuple[int, str]]:
    """doc の付いていない宣言を (行番号, 名前) で返す。

    @param path 検査するファイル
    @param include_methods コンパニオンオブジェクトの直下のメソッドも見るか
    @returns doc の無い宣言の行番号(1 始まり)と名前。同名の宣言に doc があれば含めない
    """
    lines = path.read_text(encoding="utf-8").split("\n")
    documented: set[str] = set()
    candidates: list[tuple[int, str]] = []

    for index, name in declarations(lines, include_methods):
        previous = preceding_line(lines, index)
        # `*/` は JSDoc / ブロックコメントの終わり、`//` は行コメント。
        if previous.endswith("*/") or previous.startswith("//"):
            documented.add(name)
        else:
            candidates.append((index + 1, name))

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
    if re.search(r"\bthrow\s", body_of(lines, index)) and "@throws" not in doc:
        missing.append("@throws")
    return missing


def body_of(lines: list[str], index: int) -> str:
    """宣言の本体（`{` から対応する `}` まで）。

    行数で切らずに波括弧の対応で切るのは、`useEditor` の `throw` を
    その上にある `EditorProvider` の本体として数えてしまわないため。

    @param lines ファイル全体の行
    @param index 宣言の始まりの行番号（0 始まり）
    @returns 本体の中身。`{` が見つからなければ空文字
    """
    depth = 0
    started = False
    collected: list[str] = []
    for line in lines[index:]:
        depth += line.count("{") - line.count("}")
        started = started or "{" in line
        collected.append(line)
        if started and depth <= 0:
            break
    return "\n".join(collected)


def incomplete(path: Path, include_methods: bool = False) -> list[tuple[int, str]]:
    """doc はあるが「doc に書く項目」が欠けている関数を (行番号, 説明) で返す。

    @param path 検査するファイル
    @param include_methods コンパニオンオブジェクトの直下のメソッドも見るか
    @returns 項目の欠けた関数の行番号(1 始まり)と、名前・欠けた項目の説明
    """
    lines = path.read_text(encoding="utf-8").split("\n")
    found: list[tuple[int, str]] = []
    for index, name in declarations(lines, include_methods):
        # 型・定数には引数も戻り値も無いので、項目を求めるのは関数とメソッドだけ。
        if not FUNCTION_SIGNATURE.match(lines[index]) and "." not in name:
            continue
        doc = doc_block_above(lines, index)
        if doc is None:
            continue
        missing = missing_doc_items(lines, index, doc)
        if missing:
            found.append((index + 1, f"{name} — {' / '.join(missing)} が無い"))
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


def check_one(path: Path, missing_only: bool = False, include_methods: bool = False) -> int:
    if not is_target(path):
        return 0
    missing = undocumented(path, include_methods)
    partial = [] if missing_only else incomplete(path, include_methods)
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


def check_lines(path: Path, include_methods: bool = False) -> int:
    """doc の無い宣言と項目の欠けた doc を、`<行番号>:<名前>` で 1 件 1 行に出す。

    @param path 検査するファイル
    @param include_methods コンパニオンオブジェクトの直下のメソッドも見るか
    @returns 1 件でもあれば 1、無ければ 0(対象外のファイルも 0)
    """
    if not is_target(path):
        return 0
    found = undocumented(path, include_methods) + incomplete(path, include_methods)
    for line_no, name in sorted(found):
        print(f"{line_no}:{name}")
    return 1 if found else 0


def check_all(root: Path, include_methods: bool = False) -> int:
    missing_total = 0
    partial_total = 0
    files = 0
    for path in sorted(root.rglob("*.ts*")):
        if not is_target(path):
            continue
        missing = undocumented(path, include_methods)
        partial = incomplete(path, include_methods)
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
    include_methods = "--include-methods" in args
    args = [a for a in args if a != "--include-methods"]
    if not args:
        print(__doc__)
        return 2
    if args[0] == "--all":
        return check_all(Path(args[1]) if len(args) > 1 else Path("src"), include_methods)
    if args[0] in ("--missing-only", "--lines"):
        if len(args) < 2:
            print(__doc__)
            return 2
        if args[0] == "--lines":
            return check_lines(Path(args[1]), include_methods)
        return check_one(Path(args[1]), missing_only=True, include_methods=include_methods)
    return check_one(Path(args[0]), include_methods=include_methods)


if __name__ == "__main__":
    sys.exit(main())
