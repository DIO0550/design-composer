#!/usr/bin/env python3
"""公開 API を迂回する import と、import の循環と、公開 API の置き場所を探す。

`rules/architecture.md`「モジュールの公開API」「依存方向のルール」「domains のカテゴリ」の
うち、**`index.ts` がどこにあるかを集めないと判定できないもの**を機械で確かめるためのもの。
層と方向の対（`services/` → `features/` のように、呼び出し元と禁止パターンが静的に決まる
もの）は `.oxlintrc.json` の `no-restricted-imports` が見るので、ここでは扱わない。

報告する違反は 8 つ。

- `feature-public-api` — feature の外から、その feature の公開口以外を読んでいる
- `feature-sibling` — 子 feature が、親以外の feature を読んでいる（公開口経由でも）
- `feature-ancestor` — 子 feature が、自分を入れている親を読んでいる
- `feature-nest-depth` — feature の入れ子が 2 段より深い
- `module-public-api` — `index.ts` を持つフォルダの内部を、そのフォルダの外から読んでいる
- `domains-category` — `src/domains/` のモジュールがカテゴリのフォルダの下にいない
- `import-cycle` — ファイル単位の循環
- `feature-cycle` — feature 単位の循環

**入れ子のモジュールフォルダは、それ自体が公開 API を持つ。** `index.ts` に解決される
import は `module-public-api` の違反にしない。`libs/<x>/fake/index.ts`（`rules/testing.md`
「テスト用の単純な実装(フェイク)を優先」に沿って置かれたフェイクの入口）を例外リストで
除くのではなく、規約の読み方として通すため。

**feature だけは 1 段狭い。** 外から読んでよいのは feature の `index.ts` と、テスト用の
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

from ts_sources import DEFAULT_ROOT, FEATURES_ROOT, feature_of, report, run, source_files

# tsconfig.json / vite.config.ts のパスエイリアス（`@/*` → `src/*`）。
ALIAS = "@/"
ALIAS_ROOT = DEFAULT_ROOT

# ドメイン層の位置。この直下はカテゴリのフォルダで、モジュールはその下に置く。
DOMAINS_ROOT = f"{ALIAS_ROOT}/domains"

# `import ... from "X"` / `export ... from "X"` / `import("X")` の X を、行番号付きで拾う。
#
# 型だけの import も一緒に拾う。循環で困るのは実行時のロード順ではなく設計の向きで
# （`features/editor/features/canvas/index.ts` の doc が「canvas -> editor の辺を作ると
# 循環する」という不変条件を書いている）、型だけの import でもその向きは逆転するため。
SPECIFIER = re.compile(r'(?:from|import)\s*\(?\s*"([^"]+)"')

# コメント行の始まり。doc に import のパスを書く箇所があるので、実 import と数えない。
COMMENT_LINE = re.compile(r"^\s*(?://|\*|/\*)")

# フォルダを指す import の解決先。
INDEX_NAMES = ("index.ts", "index.tsx")

# feature がテスト用の公開口を置けるフォルダ。
TEST_ENTRY_FOLDERS = ("__tests__", "__stories__")

# feature を入れ子にしてよい深さ（`features/<親>/features/<子>/` まで）。
FEATURE_NEST_LIMIT = 2


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


def parent_feature_of(name: str) -> str | None:
    """その feature を入れている親 feature を求める。

    @param name feature のパス
    @returns 親 feature のパス。トップレベルの feature なら `None`
    """
    marker = "/features/"
    cut = name.rfind(marker)
    return name[:cut] if cut != -1 else None


def nest_depth_of(name: str) -> int:
    """その feature が何段目にいるかを数える。

    @param name feature のパス
    @returns `/features/` の段数 + 1（トップレベルなら 1、その子なら 2、
        上限を超えた孫なら 3 以上）
    """
    return name.count("/features/") + 1


def is_feature_entry(target: str, name: str) -> bool:
    """その import 先が feature の公開口かを答える。

    @param target import 先のファイルのパス
    @param name その feature の名前
    @returns 本番の `index.ts` か、テスト用の公開口なら真
    """
    if os.path.basename(target) not in INDEX_NAMES:
        return False
    folder = os.path.dirname(target)
    root = f"{FEATURES_ROOT}/{name}"
    entries = (root, *(f"{root}/{sub}" for sub in TEST_ENTRY_FOLDERS))
    return folder in entries


def feature_relation(owner: str | None, reached: str) -> tuple[str, str] | None:
    """他 feature の公開口へ入る辺が、向きとして許されるかを答える。

    許すのは**親から直下の子へ**の一方向だけ。子同士を繋ぐのは親の仕事で、子が別の子を
    直接読むと、同じ階層の中に隠れた上下関係ができる（`rules/consistency.md`）。

    @param owner import を書いている側の feature。feature の外なら `None`
    @param reached import 先の feature
    @returns 違反なら「種別, 理由」の対。許される向きなら `None`
    """
    if owner is None:
        return None
    if parent_feature_of(reached) == owner:
        return None
    if owner.startswith(f"{reached}/features/"):
        return ("feature-ancestor", f"子が親 {reached} を読んでいる")
    return ("feature-sibling", f"{reached} を読んでいる（繋ぐのは親だけ）")


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
    # 自分の feature の中は素通り。外から入る辺だけを、その feature の公開口に絞る。
    enters_other_feature = reached is not None and owner != reached
    if enters_other_feature:
        if not is_feature_entry(target, reached):
            # 他 feature の内部への import は module-public-api にも当たるが、feature の
            # ほうが狭い（中のモジュールの index も読めない）ので、そちらだけで報告する。
            return ("feature-public-api", f"{reached} の公開口ではない")
        # 公開口を通っていても、向きが親から子でなければ通さない。
        return feature_relation(owner, reached) or ("", "")
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

    crossing: list[str] = []
    bypassing: list[str] = []
    siblings: list[str] = []
    ancestor_reads: list[str] = []
    feature_edges: dict[str, list[str]] = {}
    for importer, targets in graph.items():
        owner = feature_of(importer)
        for number, target in targets:
            reached = feature_of(target)
            if owner is not None and reached is not None and owner != reached:
                feature_edges.setdefault(owner, []).append(reached)
            kind, reason = classify(importer, target, modules)
            collected = {
                "feature-public-api": crossing,
                "module-public-api": bypassing,
                "feature-sibling": siblings,
                "feature-ancestor": ancestor_reads,
            }.get(kind)
            if collected is not None:
                collected.append(f"{importer}:{number} -> {target}（{reason}）")

    file_cycles = [" -> ".join(c) for c in cycles_in({k: [t for _, t in v] for k, v in graph.items()})]
    feature_cycles = [" -> ".join(c) for c in cycles_in(feature_edges)]

    uncategorized = uncategorized_domains(modules)
    too_deep = sorted(
        f"{FEATURES_ROOT}/{name}（{nest_depth_of(name)} 段目）"
        for name in {feature_of(path) for path in paths}
        if name is not None and nest_depth_of(name) > FEATURE_NEST_LIMIT
    )

    groups = (
        ("feature-public-api", crossing),
        ("feature-sibling", siblings),
        ("feature-ancestor", ancestor_reads),
        ("feature-nest-depth", too_deep),
        ("module-public-api", bypassing),
        ("domains-category", uncategorized),
        ("import-cycle", file_cycles),
        ("feature-cycle", feature_cycles),
    )
    for kind, lines in groups:
        if lines:
            report(kind, lines)
    total = sum(len(lines) for _, lines in groups)
    print(f"import 規約の違反 {total} 件 / {len(paths)} ファイル")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(run(scan, __doc__))
