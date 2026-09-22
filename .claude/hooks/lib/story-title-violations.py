#!/usr/bin/env python3
"""story の `title` が、そのファイルのフォルダ階層と食い違っていないかを探す。

Storybook のツリーは `title` の綴りだけで組まれる。`title` はフォルダから導出されず
手で書く文字列なので、フォルダを動かしても黙って古い位置に残る。実際に 7 つの子 feature
を `features/editor/features/` へ移した回で、ツリー上は 37 本が親と横並びのままになった
（#667 / #669）。

報告する違反は 2 つ。

- `story-title-tree` — `title` のツリー上の位置が、フォルダ階層から導出した綴りと違う
- `story-title-missing` — `title` をリテラル 1 行として一意に取れず、検査できない

**`title:` の行が 2 本以上あるファイルは、取れないほうへ倒す。** 既定 export の外にある
`title:`（`args` に切り出したコンポーネントの props など）を story の title と取り違えると、
Storybook が実際に使う綴りを一度も見ないまま通してしまう。

**見るのは最後のセグメントを除いた全部。** 最後のセグメント（ツリーの葉に出る表示名）は
フォルダ名ではなく、そのフォルダが公開しているコンポーネント名に従っている実例がある
（`document-open-failure/` の `DocumentOpenFailureBanner`）。葉まで縛ると、その 1 本を
通すのにフォルダの改名か例外リストが要る。

**葉を差し出すフォルダが無いときは、導出した全部がツリーの位置になる。** story が層や
feature のフォルダへ直に置かれていると、葉の位置に層・feature の名前が来てしまい、
どんな綴りでも通る（`src/features/editor/features/canvas/x.stories.tsx` が
`features/editor/features/<何でも>` で通る、という #669 と同じ形になる）。

導出は 3 手。

1. 構造セグメントを取る。`src/features/<x>/...` なら `features/<x>` で、子 feature が
   続く間 `features/<子>` を継ぎ足す。`features` 以外の層は第 1 セグメントだけ
2. 残りから `components` を落とす。`components/` は器であって語彙ではない
3. 残った kebab フォルダを PascalCase にする

使い方:
    story-title-violations.py [ルート]   # 既定のルートは src

違反があれば標準出力へ報告して終了コード 1、無ければ件数だけ出して 0。
"""

import re
import sys
from pathlib import Path

from ts_sources import feature_of, report, run, source_files

# `.storybook/main.ts` の glob（`../src/**/*.stories.@(ts|tsx)`）が拾う綴り。
#
# `main.ts` を Python から読んで導出はしない。TS の設定を解釈する処理そのものが、
# どの検査も当たっていない推測になるため。代わりに `main.ts` 側へこのファイルを指す
# コメントを置いて、glob を増やすときにここも増やす形にしてある。
STORY_MARKER = ".stories."

# 既定 export のメタが持つ `title: "..."`。テンプレートリテラル・定数参照は拾わない
# （取れないものを黙って通すと、この検査を外す抜け道になる）。
TITLE = re.compile(r'^\s*title:\s*"([^"]+)"', re.M)

# feature 内で器として挟まるフォルダ。`title` には出ない。
CONTAINER_DIR = "components"


def pascal_case(name: str) -> str:
    """kebab-case のフォルダ名を、`title` に出る綴りへ直す。

    @param name フォルダ名（`artboard-canvas`）
    @returns PascalCase の綴り（`ArtboardCanvas`）
    """
    return "".join(word[:1].upper() + word[1:] for word in name.split("-"))


def structural_segments(directory: str) -> list[str]:
    """`title` に小文字のまま出る部分（層と feature の連なり）を求める。

    @param directory 走査ルートから見たフォルダのパス（`src/features/editor/...`）
    @returns 構造セグメントの並び（`["features", "editor", "features", "canvas"]`）
    """
    # どちらの枝でも第 1 セグメント（層の名前）から始まる。feature の中なら、そこへ
    # feature の連なりが続く。
    layer = directory.split("/")[1:2]
    name = feature_of(f"{directory}/index.ts")
    return layer if name is None else layer + name.split("/")


def tree_segments(directory: str) -> list[str]:
    """フォルダ階層から、`title` のうちツリーの位置にあたる部分を導出する。

    @param directory 走査ルートから見たフォルダのパス
    @returns 葉（表示名）の手前までのセグメントの並び。葉を差し出すフォルダが無ければ
        構造セグメントがそのまま位置になる
    """
    segments = structural_segments(directory)
    rest = [part for part in directory.split("/")[len(segments) + 1 :] if part != CONTAINER_DIR]
    return segments + [pascal_case(part) for part in rest[:-1]]


def scan(root: Path) -> int:
    """走査ルート配下の story を集めて、`title` の食い違いを報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = [path for path in source_files(root) if STORY_MARKER in path.rsplit("/", 1)[-1]]
    mismatched: list[str] = []
    unreadable: list[str] = []

    for path in paths:
        found = TITLE.findall(Path(path).read_text(encoding="utf-8"))
        if len(found) != 1:
            reason = "が見つからない" if not found else f"が {len(found)} 本あり、どれが story の title か決まらない"
            unreadable.append(f'{path}（`title: "..."` の行{reason}）')
            continue
        title = found[0].split("/")
        # 葉（最後のセグメント）は表示名なので比べない。
        tree = tree_segments(path.rsplit("/", 1)[0])
        if title[:-1] != tree:
            expected = "/".join(tree + ["<表示名>"])
            mismatched.append(f"{path}: {'/'.join(title)}（フォルダからの導出は {expected}）")

    groups = (("story-title-tree", mismatched), ("story-title-missing", unreadable))
    for kind, lines in groups:
        if lines:
            report(kind, lines)
    total = sum(len(lines) for _, lines in groups)
    print(f"story の title の違反 {total} 件 / {len(paths)} ファイル")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(run(scan, __doc__))
