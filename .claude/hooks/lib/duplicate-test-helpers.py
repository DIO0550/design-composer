#!/usr/bin/env python3
"""`__tests__/` に、本体がまったく同じヘルパーが 2 つ以上いないかを探す。

`rules/testing.md`「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で
共通化する」を機械で確かめるためのもの。ルールが縛るのは「2つ以上のテストファイル」
であってフォルダではないため、**プロジェクト全体の `__tests__/` を横断**して探す
（フォルダ単位に限定すると、別モジュールへコピーしたヘルパーを見逃す）。

**本体が一字一句同じものだけ**を報告する（空白の入れ方の違いは無視する）。似ている
だけのものは見ない。偽陽性で止まるフックはエスケープハッチを足す運用を招き、全体が
信用されなくなるため（`.claude/hooks/README.md`「例外(エスケープハッチ)」）。

使い方:
    duplicate-test-helpers.py <検査するファイル>   # そのファイルが絡む重複だけ（プロジェクト全体から探す。人向けの報告）
    duplicate-test-helpers.py --all [ルート]        # 全体（既定のルートは src。人向けの報告）
    duplicate-test-helpers.py --lines <検査するファイル>  # そのファイルの重複行だけを `<行番号>:<名前>` で 1 件 1 行(CI が追加行と突き合わせる用。lint-suppressions.py と同じ形式)

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

    総称引数 `<T>` の直後を渡された場合は、先に `<...>` を読み飛ばしてから
    `(` を探す。引数の型注釈が `Readonly<{ x: number }>` のように `{}` を含んでいても、
    ここでは `(` `)` の対応しか見ないので巻き込まない(型注釈を本体と読み違えて
    無関係な引数どうしを重複と誤判定しないため)。
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


def helpers_in(path: Path) -> list[tuple[str, str, int]]:
    """そのファイルが持つ（名前, 空白を潰した本体, 宣言の行番号）の一覧。行番号は 1 始まり。"""
    try:
        source = path.read_text(encoding="utf-8")
    except OSError:
        return []
    found = []
    for match in DECLARATION.finditer(source):
        name = match.group(1) or match.group(2)
        # 本体を探す起点は引数リストが閉じたところから。そのままだと、引数の型注釈に
        # 現れる `{`(例: `Readonly<{ x: number }>`)を本体の開始と読み違える
        body = re.sub(
            r"\s+", " ", body_after(source, params_end(source, match.end()))
        ).strip()
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


def groups_for_file(target: Path) -> list[list[tuple[Path, str, int]]]:
    """`target` が絡む重複だけを返す。探す範囲は同じフォルダに限らずプロジェクト全体

    (別モジュールへコピーした重複を見逃さないため)。プロジェクト内の既存の重複まで
    毎回並べると、触っていないものの報告に紛れて今書いた分が読めなくなるので、
    `target` を含まないグループは返さない。
    """
    target_resolved = target.resolve()
    return [
        places
        for places in duplicate_groups(helpers_under(project_src_root(target)))
        if any(path.resolve() == target_resolved for path, _, _ in places)
    ]


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
        # `<行番号>:<名前>` を 1 件 1 行、フィルタなしで返す(追加行かどうかの判定は呼ぶ側が持つ)
        if len(args) < 2:
            return 0
        target = Path(args[1])
        if not is_valid_target(target):
            return 0
        target_resolved = target.resolve()
        found = False
        for places in groups_for_file(target):
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
