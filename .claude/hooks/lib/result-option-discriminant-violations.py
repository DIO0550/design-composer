#!/usr/bin/env python3
"""`Result` / `Option` の判別子を、定義元の外で直接読み書きしている箇所を探す。

`rules/coding.md`「エラーと不在の表現」の「判別子を直接読み書きしてよいのは、その
判別子を型宣言で定義しているファイルの中だけ」を機械で確かめるためのもの。どう表現されて
いるか（`ok` / `some` という判別子を持つ、という形）を知る場所を定義元 1 つに閉じておくと、
表現を変えるときに触る場所がそこだけで済む。

見るのは 2 つで、種別を分けて報告する。

- **読み側**（`result-option-read`）: `result.ok` のような直読み。判定は `Result.isOk` /
  `Option.isSome` を通す
- **作る側・比べる側**（`result-option-write`）: `{ ok: false, error: e }` のような値
  リテラルでの直書き。テストの期待値も含む。値は `Result.err(e)` / `Option.some(v)` で作る

免除をファイル単位の除外リストにはしない。`src/libs/json-lexical-scanner/index.ts` が
`ok` を判別子にした別の直和（`ScanOutcome` / `StringScanOutcome`）を持っており、`ok` を
判別子にした直和はこの先も増えうるため。

**この免除は、そのファイルに対しては判別子ごとの素通しになる**（`json-lexical-scanner`
に将来 `Result` の直読みが入っても止まらない）。除外リストなら定義元が増えるたびに触る
ことになるので、そちらは採らない。

判定の仕組みは 4 つ。

- **コードだけを見る**: 行から文字列リテラルの中身・`//` 以降・`/* */` の中を落として
  から、定義・読み・値リテラルを探す。落とさないと、コメントに書いた `{ ok: true }` で
  そのファイルが丸ごと免除され、**出力には何も出ないまま検査が無効になる**
- **定義しているか**: `type X =` の行から波括弧の深さが 0 に戻って宣言が閉じる（`;` か
  `}` が出る）までを型宣言の領域とし、その中の `名前: true|false` だけを定義と数える。
  `;` 終端で見分ける形は採らない（TS は型メンバを `,` でも書けるので、`,` 区切りの型を
  書いた瞬間に偽陽性になる）。領域の外の `{ ok: false }` は値のリテラルなので数えない
  （数えると `toEqual({ ok: false })` を書いたテストファイルが丸ごと素通りになる）
- **読んでいるか**: `.<判別子>` のうち、直後が `(` / `<` でも識別子の続き（`.okValue`）
  でもないもの。`(` / `<` が外すのは `wrapper.some<number>(2)` のような**コンパニオン
  以外**のメソッド呼び出しで、`Result.ok(1)` / `Option.some<T>(v)` はレシーバの名前で
  外れる。レシーバの名前が効くのは `[Result.ok, Option.some]` のように値として渡す形
- **直書きしているか**: その判別子を定義していないファイルにある
  `名前: true|false`。型宣言の中にあれば定義になるので、報告に残るのは領域の外だけ。
  領域の外に書いた型注釈（`const x: { ok: true } = …`）も直書きとして報告する。
  判別子を定義していないファイルが表現を書いていることに変わりはない

**分割代入（`const { ok } = result`）・`"ok" in result`・`result["ok"]` は拾わない。**
どれも `src/` に 0 件で、拾おうとすると型宣言の中の `ok` と見分けが付かなくなる。
作る側でも、**真偽リテラルでない判別子（`{ ok: flag }`）と shorthand（`{ ok, value }`）は
拾わない。** 型宣言の中のメンバと見分ける手掛かりが真偽リテラルしか無いため。
`response.ok`（Fetch API）のように**外の語彙が同じ綴りを持つ形**は、いま `src/` に
無いのでそのまま違反になる。出てきたら `libs/` の境界で詰め替えるか、この表を見直す。

使い方:
    result-option-discriminant-violations.py [ルート]   # 既定のルートは src

違反があれば標準出力へ報告して終了コード 1、無ければ件数だけ出して 0。
"""

import re
import sys
from pathlib import Path

from ts_sources import report, run, source_files

# 判別子と、その値を作るコンパニオンオブジェクトの名前。
#
# 名前を `src/` から機械的に集める形にはしない。集めると「真偽リテラルの判別子はすべて
# 定義元でしか読み書きできない」という、どの規約にも書かれていない決まりを検査が先に
# 作ることになる。ここにあるのは `rules/coding.md` が名指ししている 2 つだけ。
DISCRIMINANTS = {"ok": "Result", "some": "Option"}

# 報告の種別。読み側と作る側を分けて出し、判定表がどちらで止まったかを見分けられるようにする。
READ = "result-option-read"
WRITE = "result-option-write"
KINDS = (READ, WRITE)

# 1 行に閉じている文字列・テンプレートリテラル。閉じていない引用符は、コメントの中の
# アポストロフィ（`// don't`）でしかないので触らない。
QUOTED = re.compile(r"\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`")

# 1 行に閉じているブロックコメント。
INLINE_BLOCK_COMMENT = re.compile(r"/\*.*?\*/")

# 型宣言の始まり。`type X = ...` の形だけを見る（このリポジトリは class を使わず
# → `rules/coding.md`「ルール」、`interface` も `src/` に 0 件）。
TYPE_DECLARATION = re.compile(r"^\s*(?:export\s+)?type\s+[A-Za-z_$][\w$]*\b")

# 真偽リテラルを持つメンバ。型宣言の中なら定義、外なら値リテラルにあたる。複数行に開いた
# `readonly ok: true;` / `ok: false,` と、1 行に畳んだ `{ value: number, ok: true }` を拾う。
BOOLEAN_MEMBER = re.compile(
    r"(?:^|[{;,])\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*:\s*(?:true|false)\b"
)


def code_lines(lines: list[str]) -> list[tuple[int, str]]:
    """各行から、コードでない部分（文字列の中身とコメント）を落とす。

    @param lines ファイルの行の並び
    @returns 「行番号, コードだけを残した行」の並び。全部が落ちた行は空文字になる
    """
    found: list[tuple[int, str]] = []
    in_block_comment = False
    for number, line in enumerate(lines, start=1):
        code = line
        if in_block_comment:
            closed = code.find("*/")
            if closed < 0:
                found.append((number, ""))
                continue
            code = code[closed + 2 :]
            in_block_comment = False
        code = QUOTED.sub('""', code)
        code = INLINE_BLOCK_COMMENT.sub(" ", code)
        opened = code.find("/*")
        if opened >= 0:
            in_block_comment = True
            code = code[:opened]
        found.append((number, code.split("//", 1)[0]))
    return found


def read_pattern(name: str, companion: str) -> re.Pattern[str]:
    """判別子の直読みを拾う式を組み立てる。

    @param name 判別子の名前
    @param companion その値を作るコンパニオンオブジェクトの名前
    @returns 直読み 1 件にマッチする式
    """
    return re.compile(rf"(?<!\b{companion})\.{name}\b(?!\s*[(<])")


def declared_boolean_members(code: list[tuple[int, str]]) -> set[str]:
    """そのファイルが型宣言の中で真偽リテラルに縛っているメンバ名を集める。

    @param code `code_lines` が返した「行番号, コードだけを残した行」の並び
    @returns メンバ名の集合。型宣言が無ければ空
    """
    found: set[str] = set()
    depth = 0
    in_declaration = False
    for _, line in code:
        if not in_declaration and TYPE_DECLARATION.match(line):
            in_declaration = True
            depth = 0
        if not in_declaration:
            continue
        found.update(member.group(1) for member in BOOLEAN_MEMBER.finditer(line))
        depth += line.count("{") - line.count("}")
        declaration_ended = depth <= 0 and (";" in line or "}" in line)
        if declaration_ended:
            in_declaration = False
    return found


def violations_in(path: str) -> dict[str, list[str]]:
    """1 ファイルの中の直読みと直書きを探す。

    @param path 読み取るファイルのパス
    @returns 種別（`result-option-read` / `result-option-write`）ごとの、違反 1 件ごとの
        説明。そのファイルが型宣言で定義している判別子の分は含めない
    """
    code = code_lines(Path(path).read_text(encoding="utf-8").splitlines())
    defined = declared_boolean_members(code)
    targets = {
        name: read_pattern(name, companion)
        for name, companion in DISCRIMINANTS.items()
        if name not in defined
    }
    found: dict[str, list[str]] = {kind: [] for kind in KINDS}
    for number, line in code:
        for name, pattern in targets.items():
            if pattern.search(line):
                found[READ].append(f"{path}:{number} `.{name}` の直読み（{line.strip()}）")
        for member in BOOLEAN_MEMBER.finditer(line):
            if member.group(1) in targets:
                found[WRITE].append(
                    f"{path}:{number} `{member.group(1)}:` の直書き（{line.strip()}）"
                )
    return found


def scan(root: Path) -> int:
    """ルート配下を走査して違反を報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = source_files(root)
    found: dict[str, list[str]] = {kind: [] for kind in KINDS}
    for path in paths:
        for kind, lines in violations_in(path).items():
            found[kind].extend(lines)
    for kind, lines in found.items():
        if lines:
            report(kind, lines)
    print(
        f"判別子の直読み {len(found[READ])} 件 / 直書き {len(found[WRITE])} 件"
        f" / {len(paths)} ファイル"
    )
    return 1 if any(found.values()) else 0


if __name__ == "__main__":
    sys.exit(run(scan, __doc__))
