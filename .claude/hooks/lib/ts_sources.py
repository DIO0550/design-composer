#!/usr/bin/env python3
"""`src/` の TypeScript を走査する検査スクリプトの共通部分。

走査の対象の集め方・報告の形・コマンドラインの受け方は、どの検査でも同じものが要る。
`import-rule-violations.py` と `result-option-read-violations.py` と
`story-title-violations.py` がこれを読む。

**ファイル名だけアンダースコア。** `lib/` の綴りはケバブケースだが、ハイフンを含む名前は
Python のモジュールとして import できない。直接実行されるスクリプトの隣に置いてあるので、
`sys.path` を触らずに `import ts_sources` で読める。
"""

import re
import sys
from pathlib import Path

# ソースの置き場。走査ルートを省いたときの既定でもあり、`src/` から始まる固定パス
# （`FEATURES_ROOT` / `import-rule-violations.py` の `ALIAS_ROOT`）の出どころでもある。
DEFAULT_ROOT = "src"

SOURCE_SUFFIXES = (".ts", ".tsx")

# feature 層の位置。この下で `features/` が続く限り、子 feature として辿る。
FEATURES_ROOT = f"{DEFAULT_ROOT}/features"

# コメント行の始まり。doc に綴りを書く箇所があるので、実コードと数えない。
COMMENT_LINE = re.compile(r"^\s*(?://|\*|/\*)")

# 報告が長くなると読まれないので、種別ごとに先頭からこの件数までを出す。
MAX_REPORTED = 10


def source_files(root: Path) -> list[str]:
    """走査の対象になるファイルを集める。

    @param root 走査を始めるフォルダ
    @returns `/` 区切りに正規化したパスの並び。型宣言（`*.d.ts`）は実装を持たないので除く
    """
    return [
        path.as_posix()
        for path in sorted(root.rglob("*"))
        if path.suffix in SOURCE_SUFFIXES and not path.name.endswith(".d.ts")
    ]


def feature_of(path: str) -> str | None:
    """そのファイルが属する、いちばん深い feature のパスを求める。

    「`index.ts` を持つフォルダだけを feature と数える」形にはしない。公開 API を
    持たないフォルダを feature 層の直下に作ったときに、そこだけ検査から外れるため
    （外れると、そこを踏み台にして他 feature の内部を読めてしまう）。

    辿るのは `src/features/<x>` から続く `features/<y>` のつながりだけで、パス中の
    最後の `features/` は見ない。`components/features/` のような偶然のフォルダ名を
    feature 層と取り違えると、そこから先の検査が丸ごとずれる。

    @param path 対象のファイルのパス
    @returns 属する feature のパス（`editor` / `editor/features/canvas`）。
        feature の外なら `None`
    """
    parts = path.split("/")
    if len(parts) <= 3 or f"{parts[0]}/{parts[1]}" != FEATURES_ROOT:
        return None
    name = parts[2]
    rest = parts[3:]
    # 子 feature は親の直下の `features/` にだけ置ける。
    while len(rest) > 2 and rest[0] == "features":
        name = f"{name}/features/{rest[1]}"
        rest = rest[2:]
    return name


def report(kind: str, lines: list[str]) -> None:
    """違反を種別ごとにまとめて出力する。

    @param kind 違反の種別
    @param lines 違反 1 件ごとの説明
    """
    print(f"[{kind}] {len(lines)} 件")
    for line in lines[:MAX_REPORTED]:
        print(f"  {line}")
    if len(lines) > MAX_REPORTED:
        print(f"  ... 他 {len(lines) - MAX_REPORTED} 件")


def run(scan, doc: str | None) -> int:
    """コマンドラインの引数を解いて走査を始める。

    @param scan 走査するフォルダを受け取り、終了コードを返す関数
    @param doc ルートが見つからないときに出す使い方の説明
    @returns 終了コード。ルートが無ければ 2、それ以外は `scan` の戻り値
    """
    args = sys.argv[1:]
    root = Path(args[0]) if args else Path(DEFAULT_ROOT)
    if not root.is_dir():
        print(doc)
        return 2
    return scan(root)
