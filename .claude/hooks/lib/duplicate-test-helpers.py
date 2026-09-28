#!/usr/bin/env python3
"""`__tests__/` に、本体がまったく同じヘルパーが 2 つ以上いないかを探す。

`rules/testing.md`「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で
共通化する」を機械で確かめるためのもの。ルールが縛るのは「2つ以上のテストファイル」
であってフォルダではないため、**プロジェクト全体の `__tests__/` を横断**して探す
（フォルダ単位に限定すると、別モジュールへコピーしたヘルパーを見逃す）。

**本体が一字一句同じものだけ**を報告する（空白の入れ方の違いは無視する）。似ている
だけのものは見ない。偽陽性で止まるフックはエスケープハッチを足す運用を招き、全体が
信用されなくなるため（`.claude/hooks/README.md`「例外(エスケープハッチ)」）。

本体として比べるのは、引数リストと戻り値の型注釈を読み飛ばした後ろの `{…}`（アロー関数で
`=>` の後ろが `{` でなければ、その式）。引数や戻り値の型だけが同じヘルパーを重複と読まない
ため。

意図した取りこぼし（判定表 `duplicate-test-helpers-cases.sh` の `miss`）:
- 先頭の桁から始まらない宣言（入れ子の関数・メソッド）は見ない
- 空白を潰して `MIN_BODY_CHARS` 未満の本体は見ない
- 文字列・コメントの中の括弧と `;` も、括弧・文の区切りとして数える（型注釈の中の文字列
  リテラル型だけは読み飛ばす）
- オーバーロードのシグネチャ（本体を持たない `function f(x: string): string;`）は、後ろに
  ある実装の本体を自分の本体と読む
- `--base-root` を渡した `--lines` は、本体の数が base から増えていない重複を報告しない。
  ある本体を 1 つのファイルから消して別のファイルへ書いた場合も、分割と見分けられないので
  報告しない（判定表 `check-added-cases.sh`）

使い方:
    duplicate-test-helpers.py <検査するファイル>   # そのファイルが絡む重複だけ（プロジェクト全体から探す。人向けの報告）
    duplicate-test-helpers.py --all [ルート]        # 全体（既定のルートは src。人向けの報告）
    duplicate-test-helpers.py --lines <検査するファイル>  # そのファイルの重複行だけを `<行番号>:<名前>` で 1 件 1 行(CI が追加行と突き合わせる用。lint-suppressions.py と同じ形式)
    duplicate-test-helpers.py --lines <検査するファイル> --base-root <base の src>  # 上のうち、本体の数が base より増えた重複だけ

重複があれば標準出力へ報告して終了コード 1、無ければ何も出さず 0。
"""

import re
import sys
from collections import defaultdict
from pathlib import Path

# 先頭の桁から始まる宣言だけを見る（入れ子の関数・メソッドは対象外）
DECLARATION = re.compile(
    r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[(<]"
    r"|^(?:export\s+)?const\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?\(",
    re.MULTILINE,
)

# 一字一句の比較にならないほど短い本体は見ない（`return 0;` 等の偶然の一致を避ける）
MIN_BODY_CHARS = 20

# 型注釈の中の括弧。式の中では `<` `>` が比較演算子にもなるので、式を読むときは `([{` だけを数える
TYPE_BRACKETS = "([{<"
EXPRESSION_BRACKETS = "([{"
CLOSING_BRACKET = {"(": ")", "[": "]", "{": "}", "<": ">"}

# 戻り値の型注釈を読むときの字句。`=>` を 1 つの字句にして、本体の矢印か型の続きかを見分ける
TYPE_TOKEN = re.compile(r"=>|[A-Za-z_$][\w$.]*|\"[^\"\n]*\"|'[^'\n]*'|`[^`]*`|\s+|.", re.S)

# 直後に型が続くことを示す字句。これらの後ろの `{` は本体ではなく型リテラル。最上位に `,` は
# 現れず、`typeof` `readonly` などの後ろに `{` は来ないので載せない
TYPE_CONTINUATIONS = frozenset({":", "|", "&", "?", "=>", "extends", "keyof", "is"})

# 関数型の引数リストに見える `(…)` の中身（空か、引数名の後ろに `:` `?` `,` が続くか、残余引数）。
# `(() => void)` や `(A | B)` のような括弧で囲んだ型と区別する
FUNCTION_TYPE_PARAMS = re.compile(r"\s*(?:\)|\.\.\.|[A-Za-z_$][\w$]*\s*[:?,)])")


def body_after(source: str, start: int) -> str:
    """`start` 以降で、最初の `{` に対応する `}` までを返す。"""
    open_at = source.find("{", start)
    if open_at == -1:
        return ""
    depth = 0
    for i in range(open_at, len(source)):
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
            if depth == 0:
                return source[open_at : i + 1]
    return ""


def params_end(source: str, after_open: int) -> int:
    """引数リストの開き括弧の直後(`after_open`)から、対応する `)` の直後を返す。

    総称引数 `<T>` の直後を渡された場合は、先に `<...>` を読み飛ばしてから `(` を探す。
    """
    i = after_open
    if i > 0 and source[i - 1] == "<":
        depth = 1
        while i < len(source) and depth > 0:
            if source[i] == "<":
                depth += 1
            elif source[i] == ">":
                depth -= 1
            i += 1
        open_paren = source.find("(", i)
        if open_paren == -1:
            return len(source)
        i = open_paren + 1

    depth = 1
    while i < len(source) and depth > 0:
        if source[i] == "(":
            depth += 1
        elif source[i] == ")":
            depth -= 1
        i += 1
    return i


def group_end(source: str, open_at: int, brackets: str) -> int:
    """`open_at` の開き括弧に対応する閉じ括弧の直後を返す。

    `brackets` に含まれる括弧は種類を問わず入れ子を数える。`=>` の `>` は閉じ括弧に
    数えない（`Array<() => void>` で数えると、`=>` の `>` で閉じたと読み、型の途中で止まる）。

    @param brackets 数える開き括弧の並び（`TYPE_BRACKETS` か `EXPRESSION_BRACKETS`）
    @returns 閉じ括弧の直後の位置。閉じていなければ末尾
    """
    closers = {CLOSING_BRACKET[b] for b in brackets}
    depth = 0
    for i in range(open_at, len(source)):
        ch = source[i]
        is_arrow_head = ch == ">" and source[i - 1] == "="
        closes = ch in closers and not is_arrow_head
        if ch in brackets:
            depth += 1
        elif closes:
            depth -= 1
        if depth == 0:
            return i + 1
    return len(source)


def return_type_end(source: str, after_params: int) -> int:
    """引数リストの直後から、戻り値の型注釈を読み飛ばした位置を返す。

    型が来るべき位置（`:` `|` `=>` `extends` などの直後）の `{` は型リテラル、型が完結した後の
    `{` は関数宣言の本体と読む。型が完結した後の `=>` はアロー関数の本体の矢印と読む
    （関数型の引数 `(…)` の直後の `=>` は型の続き）。

    @param after_params 引数リストの `)` の直後（`params_end` の戻り値）
    @returns 本体の `{`（関数宣言）か `=>`（アロー関数）の位置。型注釈が無ければ `after_params`、
        型注釈が閉じなければ末尾
    """
    annotation = re.compile(r"\s*:").match(source, after_params)
    if not annotation:
        return after_params
    expects_type = True
    after_function_params = False
    i = annotation.end()
    while i < len(source):
        ch = source[i]
        starts_body = ch == "{" and not expects_type
        if starts_body:
            return i
        if ch in TYPE_BRACKETS:
            opens_function_type = ch == "(" and expects_type
            after_function_params = opens_function_type and bool(FUNCTION_TYPE_PARAMS.match(source, i + 1))
            expects_type = False
            i = group_end(source, i, TYPE_BRACKETS)
            continue
        token = TYPE_TOKEN.match(source, i).group(0)
        is_body_arrow = token == "=>" and not (expects_type or after_function_params)
        if is_body_arrow:
            return i
        if not token.isspace():
            expects_type = token in TYPE_CONTINUATIONS
            after_function_params = False
        i += len(token)
    return len(source)


def expression_end(source: str, start: int) -> int:
    """式本体の終わり（最上位の `;` か、次の行が空白で始まらない改行）の位置を返す。"""
    i = start
    while i < len(source):
        ch = source[i]
        if ch in EXPRESSION_BRACKETS:
            i = group_end(source, i, EXPRESSION_BRACKETS)
            continue
        ends_line = ch == "\n" and not source.startswith((" ", "\t"), i + 1)
        if ch == ";" or ends_line:
            return i
        i += 1
    return len(source)


def arrow_body(source: str, start: int) -> str:
    """`start` の直後にある `=>` の後ろの本体を返す。

    `{` で始まればその `{…}`、そうでなければ式本体としてその式を返す。`=>` や `{` を
    後ろへ探しにいくと、後ろにある別の宣言の本体を自分の本体と読む。

    @param start 本体の `=>` か、その手前の空白の位置（`return_type_end` の戻り値）
    @returns 本体。`start` の直後が `=>` でなければ（`const x = (a + b) * c;` のような
        括弧で始まるだけの値）空文字
    """
    arrow = re.compile(r"\s*=>").match(source, start)
    if not arrow:
        return ""
    body_at = re.compile(r"\s*").match(source, arrow.end()).end()
    if source.startswith("{", body_at):
        return body_after(source, body_at)
    return source[body_at : expression_end(source, body_at)]


def body_of(source: str, declaration: re.Match[str]) -> str:
    """引数リストと戻り値の型注釈を読み飛ばした後ろにある、宣言の本体を返す。

    @param declaration `DECLARATION` に当たった宣言の始まり
    @returns 本体。見つからなければ空文字
    """
    is_arrow = declaration.group(2) is not None
    after_params = params_end(source, declaration.end())
    body_start = return_type_end(source, after_params)
    if is_arrow:
        return arrow_body(source, body_start)
    return body_after(source, body_start)


def helpers_in(path: Path) -> list[tuple[str, str, int]]:
    """そのファイルが持つ（名前, 空白を潰した本体, 宣言の行番号）の一覧。行番号は 1 始まり。"""
    try:
        source = path.read_text(encoding="utf-8")
    except OSError:
        return []
    found = []
    for match in DECLARATION.finditer(source):
        name = match.group(1) or match.group(2)
        body = re.sub(r"\s+", " ", body_of(source, match)).strip()
        if len(body) >= MIN_BODY_CHARS:
            line = source.count("\n", 0, match.start()) + 1
            found.append((name, body, line))
    return found


def helpers_under(root: Path) -> dict[str, list[tuple[Path, str, int]]]:
    """`root` 配下のすべての `__tests__/` にあるヘルパーを、本体ごとに集める。"""
    by_body: dict[str, list[tuple[Path, str, int]]] = defaultdict(list)
    for folder in sorted(root.rglob("__tests__")):
        for path in sorted(folder.glob("*.ts*")):
            for name, body, line in helpers_in(path):
                by_body[body].append((path, name, line))
    return by_body


def duplicate_groups(
    by_body: dict[str, list[tuple[Path, str, int]]],
) -> list[list[tuple[Path, str, int]]]:
    """本体ごとに集めたものから、2 箇所以上に現れたものだけを残す。"""
    return [places for places in by_body.values() if len(places) > 1]


def project_src_root(start: Path) -> Path:
    """`start` から上へたどり、見つかった最初の `src/` ディレクトリを返す。

    `node_modules` 等 `src/` の外まで `rglob` させないための境界。見つからなければ
    `start` の親を返す(単体テスト等、`src/` を持たないツリーから直接呼ぶ場合の既定)。
    """
    for ancestor in start.resolve().parents:
        candidate = ancestor / "src"
        if candidate.is_dir():
            return candidate
    return start.resolve().parent


def report(groups: list[list[tuple[Path, str, int]]]) -> None:
    print("本体が同じテストヘルパーが、__tests__ に 2 つ以上あります。")
    print(
        "rules/testing.md「同じヘルパーを2つ以上のテストファイルに書いたら、"
        "その時点で共通化する」"
    )
    print("共通の setup へ寄せるか、汎用の操作なら実装側へ移してください。")
    for places in groups:
        print()
        for path, name, line in places:
            print(f"  {path}:{line}:{name}")


def is_valid_target(target: Path) -> bool:
    """`target` が単体検査の対象になりうるか(`__tests__/` 直下の実在ファイルか)。"""
    return target.parent.name == "__tests__" and target.exists()


def groups_for_file(
    target: Path, base_root: Path | None = None
) -> list[list[tuple[Path, str, int]]]:
    """`target` が絡む重複だけを返す。探す範囲は同じフォルダに限らずプロジェクト全体

    (別モジュールへコピーした重複を見逃さないため)。プロジェクト内の既存の重複まで
    毎回並べると、触っていないものの報告に紛れて今書いた分が読めなくなるので、
    `target` を含まないグループは返さない。

    @param base_root 渡すと、同じ本体の数がそこ(base の `src`)より増えた重複だけに絞る
    """
    everywhere = helpers_under(project_src_root(target))
    by_body = grown_since(everywhere, base_root) if base_root else everywhere
    target_resolved = target.resolve()
    return [
        places
        for places in duplicate_groups(by_body)
        if any(path.resolve() == target_resolved for path, _, _ in places)
    ]


def grown_since(
    by_body: dict[str, list[tuple[Path, str, int]]], base_root: Path
) -> dict[str, list[tuple[Path, str, int]]]:
    """本体ごとに集めたものから、同じ本体の数が `base_root` 配下の `__tests__/` より増えたものだけを残す。

    有無ではなく数で比べる。base に 1 つだけあった本体を別のファイルへ写すのは、この検査が
    止めたい「重複を新しく作った」そのものなので、base に同じ本体があるだけでは除けない。

    @param by_body 比べる側(HEAD)のヘルパーを本体ごとに集めたもの(`helpers_under` の戻り値)
    @param base_root base の木を展開した先の、`src` に当たるディレクトリ
    @returns `by_body` のうち、base より数が増えた本体だけ。base に `__tests__/` が無ければ
        すべて残す
    """
    base_by_body = helpers_under(base_root)
    return {
        body: places
        for body, places in by_body.items()
        if len(places) > len(base_by_body.get(body, []))
    }


def main() -> int:
    args = sys.argv[1:]
    if args[:1] == ["--all"]:
        root = Path(args[1] if len(args) > 1 else "src")
        groups = duplicate_groups(helpers_under(root))
        if not groups:
            return 0
        report(groups)
        return 1

    if args[:1] == ["--lines"]:
        # CI が diff の追加行と突き合わせるための機械可読な出力(lint-suppressions.py と同じ形式)。
        # `<行番号>:<名前>` を 1 件 1 行で返す(追加行かどうかの判定は呼ぶ側が持つ)
        if len(args) < 2:
            return 0
        target = Path(args[1])
        if not is_valid_target(target):
            return 0
        has_base_root = args[2:3] == ["--base-root"] and len(args) > 3
        base_root = Path(args[3]) if has_base_root else None
        target_resolved = target.resolve()
        found = False
        for places in groups_for_file(target, base_root):
            for path, name, line in places:
                if path.resolve() != target_resolved:
                    continue
                print(f"{line}:{name}")
                found = True
        return 1 if found else 0

    if not args:
        return 0
    target = Path(args[0])
    if not is_valid_target(target):
        return 0
    groups = groups_for_file(target)

    if not groups:
        return 0
    report(groups)
    return 1


if __name__ == "__main__":
    sys.exit(main())
