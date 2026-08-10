"""lint 抑制コメント（biome-ignore / eslint-disable）の検出。

rules は「lint エラーは抑制ではなくコードの修正で解決する」と定めている。
ここはその判定だけを持ち、どこへ報告するかは呼ぶ側が決める。

使う側:
    .claude/hooks/block-lint-suppress.sh        編集の内容を標準入力で渡し、deny の理由にする
    .github/scripts/check-added-lint-suppressions.sh  ファイルを渡し、追加行と突き合わせる

使い方:
    python3 lint-suppressions.py            標準入力を読む
    python3 lint-suppressions.py <file>     ファイルを読む

出力は `<行番号>:<行>` が 1 件 1 行。1 件でもあれば exit 1。行番号は 1 始まり。

許可される例外:
    - useExhaustiveDependencies / react-hooks/exhaustive-deps（useEffect マウント時）
    - noUnusedVariables / no-unused-vars（ブランド型 declare const ... unique symbol の直前行のみ）
ファイル単位の無効化（// @lint-suppress-ok）は、対象ファイルを知っている呼ぶ側が見る。
"""

import re
import sys
from pathlib import Path

SUPPRESSION = re.compile(r"biome-ignore|eslint-disable(-next-line|-line)?")
EXHAUSTIVE_DEPS = re.compile(
    r"biome-ignore lint/correctness/useExhaustiveDependencies|react-hooks/exhaustive-deps"
)
UNUSED_VARIABLES = re.compile(
    r"biome-ignore.*noUnusedVariables|eslint-disable\S*.*no-unused-vars"
)
BRAND_DECLARATION = re.compile(r"declare\s+const.*unique\s+symbol")


def disallowed(lines: list[str]) -> list[tuple[int, str]]:
    """許可されていない lint 抑制コメントの行。

    @param lines 検査する行の並び（改行を含まない）
    @returns 1 始まりの行番号とその行の組。許可される例外に当たる行は含まない
    """
    found = []
    for index, line in enumerate(lines):
        if not SUPPRESSION.search(line):
            continue
        if EXHAUSTIVE_DEPS.search(line):
            continue
        following = lines[index + 1] if index + 1 < len(lines) else ""
        if UNUSED_VARIABLES.search(line) and BRAND_DECLARATION.search(following):
            continue
        found.append((index + 1, line))
    return found


def main() -> int:
    """コマンドラインからの入口。

    @returns 抑制コメントが 1 件でもあれば 1、無ければ 0
    """
    args = sys.argv[1:]
    text = Path(args[0]).read_text(encoding="utf-8") if args else sys.stdin.read()
    found = disallowed(text.split("\n"))
    for number, line in found:
        print(f"{number}:{line}")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
