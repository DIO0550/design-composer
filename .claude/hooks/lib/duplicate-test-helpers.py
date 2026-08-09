#!/usr/bin/env python3
"""同じ `__tests__/` の中に、本体がまったく同じヘルパーが 2 つ以上いないかを探す。

`rules/testing.md`「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で
共通化する」を機械で確かめるためのもの。

**本体が一字一句同じものだけ**を報告する（空白の入れ方の違いは無視する）。似ている
だけのものは見ない。偽陽性で止まるフックはエスケープハッチを足す運用を招き、全体が
信用されなくなるため（`.claude/hooks/README.md`「例外(エスケープハッチ)」）。

使い方:
    duplicate-test-helpers.py <検査するファイル>   # そのファイルが絡む重複だけ
    duplicate-test-helpers.py --all [ルート]        # 全体（既定のルートは src）

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
    """宣言の開始位置から、最初の `{` に対応する `}` までを返す。"""
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


def helpers_in(path: Path) -> list[tuple[str, str]]:
    """そのファイルが持つ（名前, 空白を潰した本体）の一覧。"""
    try:
        source = path.read_text(encoding="utf-8")
    except OSError:
        return []
    found = []
    for match in DECLARATION.finditer(source):
        name = match.group(1) or match.group(2)
        body = re.sub(r"\s+", " ", body_after(source, match.start())).strip()
        if len(body) >= MIN_BODY_CHARS:
            found.append((name, body))
    return found


def duplicates_in(folder: Path) -> dict[str, list[tuple[Path, str]]]:
    """その `__tests__/` フォルダの中で、本体が同じものを本体ごとに集める。"""
    by_body: dict[str, list[tuple[Path, str]]] = defaultdict(list)
    for path in sorted(folder.glob("*.ts*")):
        for name, body in helpers_in(path):
            by_body[body].append((path, name))
    return {body: places for body, places in by_body.items() if len(places) > 1}


def report(groups: list[list[tuple[Path, str]]]) -> None:
    print("本体が同じテストヘルパーが、同じ __tests__ の中に 2 つ以上あります。")
    print(
        "rules/testing.md「同じヘルパーを2つ以上のテストファイルに書いたら、"
        "その時点で共通化する」"
    )
    print("同フォルダの setup へ寄せるか、汎用の操作なら実装側へ移してください。")
    for places in groups:
        print()
        for path, name in places:
            print(f"  {path}:{name}")


def main() -> int:
    args = sys.argv[1:]
    if args[:1] == ["--all"]:
        root = Path(args[1] if len(args) > 1 else "src")
        groups = [
            places
            for folder in sorted(root.rglob("__tests__"))
            for places in duplicates_in(folder).values()
        ]
    else:
        if not args:
            return 0
        target = Path(args[0])
        if target.parent.name != "__tests__" or not target.exists():
            return 0
        # 編集したファイルが絡む重複だけを見る。フォルダ内の既存の重複まで
        # 毎回並べると、触っていないものの報告に紛れて今書いた分が読めなくなる
        groups = [
            places
            for places in duplicates_in(target.parent).values()
            if any(path == target for path, _ in places)
        ]

    if not groups:
        return 0
    report(groups)
    return 1


if __name__ == "__main__":
    sys.exit(main())
