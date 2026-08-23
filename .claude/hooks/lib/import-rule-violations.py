#!/usr/bin/env python3
"""公開 API を迂回する import と、import の循環を探す。

`rules/architecture.md`「モジュールの公開API」「依存方向のルール」のうち、
**import グラフを組まないと判定できないもの**を機械で確かめるためのもの。層と方向の対
（`services/` → `features/` のように、呼び出し元と禁止パターンが静的に決まるもの）は
`.oxlintrc.json` の `no-restricted-imports` が見るので、ここでは扱わない。

報告する違反は 4 つ。

- `feature-public-api` — feature の外から、その feature の公開口以外を読んでいる
- `module-public-api` — `index.ts` を持つフォルダの内部を、そのフォルダの外から読んでいる
- `import-cycle` — ファイル単位の循環
- `feature-cycle` — feature 単位の循環

**入れ子のモジュールフォルダは、それ自体が公開 API を持つ。** `index.ts` に解決される
import は `module-public-api` の違反にしない。`libs/<x>/fake/index.ts`（`rules/testing.md`
「テスト用の単純な実装(フェイク)を優先」に沿って置かれたフェイクの入口）を例外リストで
除くのではなく、規約の読み方として通すため。

**feature だけは 1 段狭い。** 外から読んでよいのは `features/<x>/index.ts` と、テスト用の
公開口（`features/<x>/__tests__/index.ts` / `__stories__/index.ts`）だけで、中のモジュールの
`index.ts` は読めない。テスト用の口を分けているのは、fixture が `@testing-library/react` を
持ち込むため本番の `index.ts` へは出せないから。

使い方:
    import-rule-violations.py [ルート]   # 既定のルートは src

違反があれば標準出力へ報告して終了コード 1、無ければ件数だけ出して 0。
"""

import os
import re
import sys
from pathlib import Path

# tsconfig.json / vite.config.ts のパスエイリアス（`@/*` → `src/*`）。
ALIAS = "@/"
ALIAS_ROOT = "src"

# feature 層の位置。この直下で `index.ts` を持つフォルダを 1 つの feature として数える。
FEATURES_ROOT = f"{ALIAS_ROOT}/features"

# `import ... from "X"` / `export ... from "X"` / `import("X")` の X を、行番号付きで拾う。
#
# Why: 型だけの import も一緒に拾う。循環で困るのは実行時のロード順ではなく設計の向きで
# （`features/canvas/index.ts` の doc が「canvas -> editor の辺を作ると循環する」という
# 不変条件を書いている）、型だけの import でもその向きは逆転するため。
SPECIFIER = re.compile(r'(?:from|import)\s*\(?\s*"([^"]+)"')

# コメント行の始まり。doc に import のパスを書く箇所があるので、実 import と数えない。
COMMENT_LINE = re.compile(r"^\s*(?://|\*|/\*)")

SOURCE_SUFFIXES = (".ts", ".tsx")

# フォルダを指す import の解決先。
INDEX_NAMES = ("index.ts", "index.tsx")

# feature がテスト用の公開口を置けるフォルダ。
TEST_ENTRY_FOLDERS = ("__tests__", "__stories__")

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


def module_folders(files: list[str]) -> set[str]:
    """`index.ts` / `index.tsx` を持つフォルダ（= 公開 API を持つモジュール）を集める。

    Why not: `__tests__/` / `__stories__/` は `index.ts` を置いてもモジュールとして数えない。
    `rules/architecture.md`「モジュールフォルダの基本形は `index.ts` + `__tests__/`」が言う
    モジュールは**それを内包するフォルダ**であって `__tests__/` 自身ではない。ここへ置く
    `index.ts` は外の feature 向けの入口を足すためのもので、持ち主の feature が自分の
    fixture を直接読むことまで塞ぐと、外へ出す気の無いものまで export する羽目になる。

    @param files 走査の対象になるファイルの並び
    @returns モジュールフォルダのパスの集合
    """
    return {
        os.path.dirname(f)
        for f in files
        if os.path.basename(f) in INDEX_NAMES
        and os.path.basename(os.path.dirname(f)) not in TEST_ENTRY_FOLDERS
    }


def resolve(specifier: str, importer: str, files: set[str]) -> str | None:
    """import 先のファイルを求める。

    @param specifier import に書かれている綴り（`@/` エイリアスと相対パスを解く）
    @param importer それを書いているファイルのパス
    @param files 実在するファイルのパスの集合
    @returns 解決できたファイルのパス。外部パッケージや実在しない綴りなら `None`
    """
    if specifier.startswith(ALIAS):
        base = f"{ALIAS_ROOT}/{specifier[len(ALIAS) :]}"
    elif specifier.startswith("."):
        base = os.path.normpath(f"{os.path.dirname(importer)}/{specifier}").replace(os.sep, "/")
    else:
        return None
    candidates = (f"{base}.ts", f"{base}.tsx", *(f"{base}/{name}" for name in INDEX_NAMES))
    return next((c for c in candidates if c in files), None)


def imports_of(path: str, files: set[str]) -> list[tuple[int, str]]:
    """そのファイルが読んでいる、リポジトリ内のファイルを求める。

    @param path 読み取るファイルのパス
    @param files 実在するファイルのパスの集合
    @returns 「行番号, import 先のパス」の並び（自分自身への import は除く）
    """
    found = []
    for number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        if COMMENT_LINE.match(line):
            continue
        for match in SPECIFIER.finditer(line):
            target = resolve(match.group(1), path, files)
            if target is not None and target != path:
                found.append((number, target))
    return found


def feature_of(path: str) -> str | None:
    """そのファイルが属する feature の名前を求める。

    Why not: 「`index.ts` を持つフォルダだけを feature と数える」形にはしない。公開 API を
    持たないフォルダを feature 層の直下に作ったときに、そこだけ検査から外れるため
    （外れると、そこを踏み台にして他 feature の内部を読めてしまう）。

    @param path 対象のファイルのパス
    @returns 属する feature の名前。feature の外なら `None`
    """
    parts = path.split("/")
    if len(parts) > 3 and f"{parts[0]}/{parts[1]}" == FEATURES_ROOT:
        return parts[2]
    return None


def is_feature_entry(target: str, name: str) -> bool:
    """その import 先が feature の公開口かを答える。

    @param target import 先のファイルのパス
    @param name その feature の名前
    @returns 本番の `index.ts` か、テスト用の公開口なら真
    """
    if os.path.basename(target) not in INDEX_NAMES:
        return False
    folder = os.path.dirname(target)
    entries = (
        f"{FEATURES_ROOT}/{name}",
        *(f"{FEATURES_ROOT}/{name}/{sub}" for sub in TEST_ENTRY_FOLDERS),
    )
    return folder in entries


def ancestors(path: str) -> list[str]:
    """そのファイルを含むフォルダを、深いものから順に並べる。

    @param path 対象のファイルのパス
    @returns 祖先フォルダのパスの並び
    """
    folder = os.path.dirname(path)
    found = []
    while folder:
        found.append(folder)
        folder = os.path.dirname(folder)
    return found


def bypassed_module(importer: str, target: str, modules: set[str]) -> str | None:
    """モジュールフォルダの内部を、そのフォルダの外から読んでいるかを答える。

    @param importer import を書いているファイルのパス
    @param target import 先のファイルのパス
    @param modules `index.ts` を持つフォルダの集合
    @returns 迂回されたモジュールフォルダのパス。迂回していなければ `None`
    """
    if os.path.basename(target) in INDEX_NAMES and os.path.dirname(target) in modules:
        return None
    outside = [f for f in ancestors(target) if f in modules and not importer.startswith(f + "/")]
    return outside[-1] if outside else None


def classify(importer: str, target: str, modules: set[str]) -> tuple[str, str]:
    """1 本の import を種別に分ける。

    Why: feature へ入る辺かどうかを**呼び出し元ではなく行き先**で決める。呼び出し元が
    feature のときだけ狭めると、`app/` から feature の内部モジュールへ直行する経路が
    どの層からも見えなくなる（`app -> features` は依存方向としては許されているため、
    oxlint も止めない）。

    @param importer import を書いているファイルのパス
    @param target import 先のファイルのパス
    @param modules `index.ts` を持つフォルダの集合
    @returns 「種別, 理由」の対。違反でなければ種別は空文字
    """
    owner = feature_of(importer)
    reached = feature_of(target)
    # 自分の feature の中は素通り。外から入る辺だけを、その feature の公開口に絞る。
    enters_other_feature = reached is not None and owner != reached
    if enters_other_feature:
        if is_feature_entry(target, reached):
            return ("", "")
        # 他 feature の内部への import は module-public-api にも当たるが、feature の
        # ほうが狭い（中のモジュールの index も読めない）ので、そちらだけで報告する。
        return ("feature-public-api", f"{reached} の公開口ではない")
    bypassed = bypassed_module(importer, target, modules)
    if bypassed is None:
        return ("", "")
    return ("module-public-api", f"{bypassed} の公開 API を迂回")


def cycles_in(graph: dict[str, list[str]]) -> list[list[str]]:
    """辿れる閉路を探す。

    @param graph 節点から、その節点が読んでいる節点への対応
    @returns 見つかった閉路の並び。各閉路は戻り先の節点で始まり、同じ節点で終わる
    """
    visiting: set[str] = set()
    visited: set[str] = set()
    stack: list[str] = []
    found: list[list[str]] = []

    def walk(node: str) -> None:
        visiting.add(node)
        stack.append(node)
        for following in graph.get(node, ()):
            if following in visiting:
                found.append(stack[stack.index(following) :] + [following])
            elif following not in visited:
                walk(following)
        stack.pop()
        visiting.discard(node)
        visited.add(node)

    sys.setrecursionlimit(max(sys.getrecursionlimit(), len(graph) * 4 + 1000))
    for node in sorted(graph):
        if node not in visited:
            walk(node)
    return found


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


def scan(root: Path) -> int:
    """ルート配下の import を走査して違反を報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = source_files(root)
    files = set(paths)
    modules = module_folders(paths)
    graph = {path: imports_of(path, files) for path in paths}

    crossing: list[str] = []
    bypassing: list[str] = []
    feature_edges: dict[str, list[str]] = {}
    for importer, targets in graph.items():
        owner = feature_of(importer)
        for number, target in targets:
            reached = feature_of(target)
            if owner is not None and reached is not None and owner != reached:
                feature_edges.setdefault(owner, []).append(reached)
            kind, reason = classify(importer, target, modules)
            if kind == "feature-public-api":
                crossing.append(f"{importer}:{number} -> {target}（{reason}）")
            elif kind == "module-public-api":
                bypassing.append(f"{importer}:{number} -> {target}（{reason}）")

    file_cycles = [" -> ".join(c) for c in cycles_in({k: [t for _, t in v] for k, v in graph.items()})]
    feature_cycles = [" -> ".join(c) for c in cycles_in(feature_edges)]

    for kind, lines in (
        ("feature-public-api", crossing),
        ("module-public-api", bypassing),
        ("import-cycle", file_cycles),
        ("feature-cycle", feature_cycles),
    ):
        if lines:
            report(kind, lines)
    total = len(crossing) + len(bypassing) + len(file_cycles) + len(feature_cycles)
    print(f"import 規約の違反 {total} 件 / {len(paths)} ファイル")
    return 1 if total else 0


def main() -> int:
    """コマンドラインから走査を始める。

    @returns 終了コード。違反があれば 1、ルートが無ければ 2、それ以外は 0
    """
    args = sys.argv[1:]
    root = Path(args[0]) if args else Path(ALIAS_ROOT)
    if not root.is_dir():
        print(__doc__)
        return 2
    return scan(root)


if __name__ == "__main__":
    sys.exit(main())
