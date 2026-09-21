#!/usr/bin/env python3
"""公開 API を迂回する import と、import の循環と、公開 API の置き場所を探す。

`rules/architecture.md`「モジュールの公開API」「依存方向のルール」「domains のカテゴリ」の
うち、**`index.ts` がどこにあるかを集めないと判定できないもの**を機械で確かめるためのもの。
層と方向の対（`services/` → `features/` のように、呼び出し元と禁止パターンが静的に決まる
もの）は `.oxlintrc.json` の `no-restricted-imports` が見るので、ここでは扱わない。

報告する違反は 6 つ。

- `feature-direction` — feature をまたぐ import の向きが親 → 子になっていない
- `feature-public-api` — feature の外から、その feature の公開口以外を読んでいる
- `module-public-api` — `index.ts` を持つフォルダの内部を、そのフォルダの外から読んでいる
- `domains-category` — `src/domains/` のモジュールがカテゴリのフォルダの下にいない
- `import-cycle` — ファイル単位の循環
- `feature-cycle` — feature 単位の循環

**feature は入れ子にできる。** `features/<親>/features/<子>/` に置いた子 feature を読んで
よいのは親だけで、兄弟同士・子から親・feature の外から子への名指しはすべて
`feature-direction` になる（`rules/architecture.md`「依存方向のルール」）。

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

from ts_sources import report, run, source_files

# tsconfig.json / vite.config.ts のパスエイリアス（`@/*` → `src/*`）。
ALIAS = "@/"
ALIAS_ROOT = "src"

# feature 層の位置。この直下のフォルダを 1 つの feature として数える。
FEATURES_ROOT = f"{ALIAS_ROOT}/features"

# feature を並べるフォルダの名前。feature の中にもう 1 段置くと、そこが子 feature になる。
FEATURES_FOLDER = "features"

# ドメイン層の位置。この直下はカテゴリのフォルダで、モジュールはその下に置く。
DOMAINS_ROOT = f"{ALIAS_ROOT}/domains"

# `import ... from "X"` / `export ... from "X"` / `import("X")` の X を、行番号付きで拾う。
#
# 型だけの import も一緒に拾う。困るのは実行時のロード順ではなく設計の向き（子 feature が
# 親を読んでいないか・兄弟を読んでいないか）で、型だけの import でもその向きは逆転するため。
SPECIFIER = re.compile(r'(?:from|import)\s*\(?\s*"([^"]+)"')

# コメント行の始まり。doc に import のパスを書く箇所があるので、実 import と数えない。
COMMENT_LINE = re.compile(r"^\s*(?://|\*|/\*)")

# フォルダを指す import の解決先。
INDEX_NAMES = ("index.ts", "index.tsx")

# feature がテスト用の公開口を置けるフォルダ。
TEST_ENTRY_FOLDERS = ("__tests__", "__stories__")


def module_folders(files: list[str]) -> set[str]:
    """`index.ts` / `index.tsx` を持つフォルダ（= 公開 API を持つモジュール）を集める。

    `__tests__/` / `__stories__/` は `index.ts` を置いてもモジュールとして数えない。
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
    """そのファイルが属する feature のフォルダを求める。

    「`index.ts` を持つフォルダだけを feature と数える」形にはしない。公開 API を
    持たないフォルダを feature 層の直下に作ったときに、そこだけ検査から外れるため
    （外れると、そこを踏み台にして他 feature の内部を読めてしまう）。

    入れ子のときは**いちばん深い** feature を返す。`features/` の次がファイルそのもの
    （`features/<親>/features/foo.ts`）なら、それは feature ではなく親の持ち物なので
    数えない。

    @param path 対象のファイルのパス
    @returns 属する feature のフォルダのパス。feature の外なら `None`
    """
    if not path.startswith(f"{FEATURES_ROOT}/"):
        return None
    parts = path.split("/")
    for index in range(len(parts) - 3, 0, -1):
        if parts[index] == FEATURES_FOLDER:
            return "/".join(parts[: index + 2])
    return None


def nests(outer: str, inner: str) -> bool:
    """その feature が、もう一方の feature を内側に持つかを答える。

    @param outer 外側の feature のフォルダのパス
    @param inner 内側にいるか確かめる feature のフォルダのパス
    @returns `inner` が `outer` の中にあれば真
    """
    return inner.startswith(f"{outer}/")


def is_top_level(feature: str) -> bool:
    """その feature が feature 層の直下にいるかを答える。

    @param feature feature のフォルダのパス
    @returns 入れ子になっていなければ真
    """
    return "/" not in feature[len(FEATURES_ROOT) + 1 :]


def wrong_direction(owner: str | None, reached: str) -> str:
    """feature をまたぐ import の向きが規約どおりかを答える。

    読んでよいのは**親から子**だけ（`rules/architecture.md`「依存方向のルール」）。
    feature の外（`app/` など）からは、入れ子になっていない feature だけを名指しできる。

    @param owner import を書いているファイルが属する feature。feature の外なら `None`
    @param reached import 先が属する feature
    @returns 向きが規約に反する理由。規約どおりなら空文字
    """
    if owner is None:
        if is_top_level(reached):
            return ""
        return f"{reached} は入れ子の feature（読めるのは親だけ）"
    if nests(owner, reached):
        return ""
    if nests(reached, owner):
        return f"{reached} は親の feature（向きは親 → 子の一方向）"
    return f"{reached} は兄弟の feature（兄弟を組めるのは親だけ）"


def is_feature_entry(target: str, feature: str) -> bool:
    """その import 先が feature の公開口かを答える。

    @param target import 先のファイルのパス
    @param feature その feature のフォルダのパス
    @returns 本番の `index.ts` か、テスト用の公開口なら真
    """
    if os.path.basename(target) not in INDEX_NAMES:
        return False
    folder = os.path.dirname(target)
    entries = (feature, *(f"{feature}/{sub}" for sub in TEST_ENTRY_FOLDERS))
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


def uncategorized_domains(modules: set[str]) -> list[str]:
    """`src/domains/` のモジュールが、カテゴリのフォルダの下にいるかを答える。

    `rules/architecture.md`「domains のカテゴリ」は、モジュールを
    `src/domains/<カテゴリ>/<モジュール>/` に置き、カテゴリ自身は `index.ts` を持たない、
    と決めている。どちらの破り方も `src/domains/` 直下のフォルダが `index.ts` を持つ形に
    なるので、1 つの条件で拾える。

    カテゴリ**間の向き**は `.oxlintrc.json` が見るが、そちらはカテゴリのフォルダ名で
    対象を絞るため、直下に作られたモジュールにはどの override も当たらない。規約に沿った
    モジュールだけが縛られ、外れたモジュールが素通りになるのを防ぐ。

    @param modules `index.ts` を持つフォルダの集合
    @returns 違反 1 件ごとの説明。すべてカテゴリ配下なら空
    """
    directly_under = [
        folder
        for folder in sorted(modules)
        if folder.startswith(f"{DOMAINS_ROOT}/")
        and "/" not in folder[len(DOMAINS_ROOT) + 1 :]
    ]
    return [
        f"{folder}/index.ts（カテゴリのフォルダは公開 API を持たず、"
        f"モジュールは `{DOMAINS_ROOT}/<カテゴリ>/` の下に置く）"
        for folder in directly_under
    ]


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

    feature へ入る辺かどうかを**呼び出し元ではなく行き先**で決める。呼び出し元が
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
    # 自分の feature の中は素通り。外から入る辺だけを、向きと公開口の 2 段で絞る。
    enters_other_feature = reached is not None and owner != reached
    if enters_other_feature:
        # 向きを先に見る。向きが規約に反しているなら、公開口かどうかは問題にならない。
        misdirected = wrong_direction(owner, reached)
        if misdirected:
            return ("feature-direction", misdirected)
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


def scan(root: Path) -> int:
    """ルート配下の import を走査して違反を報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = source_files(root)
    files = set(paths)
    modules = module_folders(paths)
    graph = {path: imports_of(path, files) for path in paths}

    misdirected: list[str] = []
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
            found = {
                "feature-direction": misdirected,
                "feature-public-api": crossing,
                "module-public-api": bypassing,
            }.get(kind)
            if found is not None:
                found.append(f"{importer}:{number} -> {target}（{reason}）")

    file_cycles = [" -> ".join(c) for c in cycles_in({k: [t for _, t in v] for k, v in graph.items()})]
    feature_cycles = [" -> ".join(c) for c in cycles_in(feature_edges)]

    uncategorized = uncategorized_domains(modules)

    for kind, lines in (
        ("feature-direction", misdirected),
        ("feature-public-api", crossing),
        ("module-public-api", bypassing),
        ("domains-category", uncategorized),
        ("import-cycle", file_cycles),
        ("feature-cycle", feature_cycles),
    ):
        if lines:
            report(kind, lines)
    total = (
        len(misdirected)
        + len(crossing)
        + len(bypassing)
        + len(uncategorized)
        + len(file_cycles)
        + len(feature_cycles)
    )
    print(f"import 規約の違反 {total} 件 / {len(paths)} ファイル")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(run(scan, __doc__))
