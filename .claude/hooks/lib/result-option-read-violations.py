#!/usr/bin/env python3
"""`Result` / `Option` の判別子を、定義元の外で直接読んでいる箇所を探す。

`rules/coding.md`「エラーと不在の表現」の「在／不在・成否の判定は `Option.isSome` /
`Result.isOk` を通す」を機械で確かめるためのもの。どう表現されているか（`ok` / `some`
という判別子を持つ、という形）を知る場所を定義元 1 つに閉じておくと、表現を変えるときに
触る場所がそこだけで済む。

**直読みしてよいのは、その判別子を型宣言で定義しているファイルの中だけ。** ファイル単位
の除外リストにはしない。`src/libs/json-lexical-scanner/index.ts` が `ok` を判別子にした
別の直和（`ScanOutcome` / `StringScanOutcome`）を持っており、`ok` を判別子にした直和は
この先も増えうるため。

**この免除は、そのファイルに対しては判別子ごとの素通しになる**（`json-lexical-scanner`
に将来 `Result` の直読みが入っても止まらない）。除外リストなら定義元が増えるたびに触る
ことになるので、そちらは採らない。

**見るのは読み側だけで、構築側のリテラル（`{ ok: false, error: e }`）は対象にしない**
（→ #524）。

判定の仕組みは 3 つ。

- **コードだけを見る**: 行から文字列リテラルの中身・`//` 以降・`/* */` の中を落として
  から、定義と読みの両方を探す。落とさないと、コメントに書いた `{ ok: true }` で
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

**分割代入（`const { ok } = result`）・`"ok" in result`・`result["ok"]` は拾わない。**
どれも `src/` に 0 件で、拾おうとすると型宣言の中の `ok` と見分けが付かなくなる。
`response.ok`（Fetch API）のように**外の語彙が同じ綴りを持つ形**は、いま `src/` に
無いのでそのまま違反になる。出てきたら `libs/` の境界で詰め替えるか、この表を見直す。

使い方:
    result-option-read-violations.py [ルート]   # 既定のルートは src

違反があれば標準出力へ報告して終了コード 1、無ければ件数だけ出して 0。
"""

import re
import sys
from pathlib import Path

from ts_sources import report, run, source_files

# 判別子と、その値を作るコンパニオンオブジェクトの名前。
#
# 名前を `src/` から機械的に集める形にはしない。集めると「真偽リテラルの判別子はすべて
# 定義元でしか読めない」という、どの規約にも書かれていない決まりを検査が先に作ることに
# なる。ここにあるのは `rules/coding.md` が名指ししている 2 つだけ。
DISCRIMINANTS = {"ok": "Result", "some": "Option"}

# 1 行に閉じている文字列・テンプレートリテラル。閉じていない引用符は、コメントの中の
# アポストロフィ（`// don't`）でしかないので触らない。
QUOTED = re.compile(r"\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`")

# 1 行に閉じているブロックコメント。
INLINE_BLOCK_COMMENT = re.compile(r"/\*.*?\*/")

# 型宣言の始まり。`type X = ...` の形だけを見る（このリポジトリは class を使わず
# → `rules/coding.md`「ルール」、`interface` も `src/` に 0 件）。
TYPE_DECLARATION = re.compile(r"^\s*(?:export\s+)?type\s+[A-Za-z_$][\w$]*\b")

# 型宣言の中の真偽リテラルのメンバ。複数行に開いた `readonly ok: true;` と、1 行に
# 畳んだ `Readonly<{ value: number, ok: true }>` の両方を拾う。
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


def violations_in(path: str) -> list[str]:
    """1 ファイルの中の直読みを探す。

    @param path 読み取るファイルのパス
    @returns 違反 1 件ごとの説明。そのファイルが型宣言で定義している判別子の分は含めない
    """
    code = code_lines(Path(path).read_text(encoding="utf-8").splitlines())
    defined = declared_boolean_members(code)
    targets = {
        name: read_pattern(name, companion)
        for name, companion in DISCRIMINANTS.items()
        if name not in defined
    }
    found = []
    for number, line in code:
        for name, pattern in targets.items():
            if pattern.search(line):
                found.append(f"{path}:{number} `.{name}` の直読み（{line.strip()}）")
    return found


def scan(root: Path) -> int:
    """ルート配下を走査して違反を報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = source_files(root)
    found = [line for path in paths for line in violations_in(path)]
    if found:
        report("result-option-read", found)
    print(f"判別子の直読み {len(found)} 件 / {len(paths)} ファイル")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(run(scan, __doc__))
