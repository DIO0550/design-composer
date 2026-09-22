#!/usr/bin/env python3
"""コメント・doc が名指ししているパスが、実体として存在するかを探す。

フォルダを動かしても書き換わるのは `import` だけで、説明の中の綴りは黙って古い位置を
指したまま残る。7 つの子 feature を `features/editor/features/` へ移した回（#679）では、
import 325 箇所が書き換わったのに説明の中の 14 箇所が残り、typecheck も lint も既存の
検出器も 1 件も捕まえなかった（#690）。判例の側にも同じ形が出ている
（`harness/case-law/consistency.md`「検出器の判定表は移動で静かに嘘になる」）。

報告する違反は 1 つ。

- `named-path-missing` — 名指ししているパスに当たる実体が無い

**見るのは説明だけで、コードの文字列リテラルは見ない。** `.ts` / `.tsx` はコメントの中、
`.md` は全文（全文が説明なので）。`import` の綴りは typecheck が、公開 API を迂回する向きは
`import-rule-violations.py` が既に見ている。

**綴りはリポジトリルートか `src/` からの絶対として解決する。** 祖先フォルダからの相対も
許すと、`src/features/editor/` の中に書かれた `features/sidebar` が
`src/features/editor/features/sidebar` として実在扱いになり、#690 が直した 14 箇所のうち
5 箇所がそのまま素通りする（実測）。

**第 1 セグメントがフォルダ名のものだけを見る。** その一覧はハードコードせず、トップレベルと
`src/` 直下のフォルダ名から導出する。一覧そのものが移動で陳腐化するのでは、この検査が
防ごうとしている形を検査自身が持つことになる。

綴りは**前後の `.` と `/` を落としてから**解決する。`src/hooks/` の末尾スラッシュ・
`docs/...` のプレースホルダ・文末の `FilePath.` が、この 1 つの規則で落ちる。

実在の判定は 2 手。

1. そのパスがある
2. 末尾のセグメントが、実在する名前の**区切りまでの接頭辞**になっている
   （`docs/01` が `docs/01-file-format.md` を、`src/test-setup` が `src/test-setup.ts` を
   指す形がある）。区切り（`-` `.` 空白）の位置でしか認めないので、`features/token` は
   `features/tokens` で通らない。拡張子を省いた綴りもここで当たるので、`.ts` / `.tsx` を
   足して確かめる手は持たない（同じ判定が 2 つに割れる）

意図した取りこぼしが 6 つある。

- **PascalCase のセグメントを含む綴りは見ない。** フォルダ名はケバブケース
  （`rules/naming.md`「ファイル名」）なので、`components/ContextMenu` のような綴りは
  パスではなく名前（story の `title`・コンポーネント名）を指している
- **`-` で終わる綴りは見ない。** `harness/records/pr-<番号>.md` のようなプレースホルダが
  `<` で切れた形で、パスの名指しではない
- **相対の綴りは見ない**（第 1 セグメントがフォルダ名でないもの）
- **`.claude/hooks/README.md` は走査しない。** probe レシピが実在しないファイル
  （`src/app/probe.ts` など）を意図して名指しし、`/` 区切りの層の列挙
  （`components/hooks/utils/types`）もパスと同じ綴りになる
- **`harness/records/` は走査しない**（`harness/records/README.md`「過去の記録は
  書き換えない」。当時の綴りとして正しい）
- **git が追跡していないファイルは走査しない。** push の時点では差分がコミットされて
  いるのでゲートに穴は開かないが、コミット前の新しいファイルは層 3 でも見えない
  （probe を当てるときは `git add -N` で索引へ入れる）

使い方:
    named-path-violations.py [ルート]   # 既定のルートはリポジトリルート

違反があれば標準出力へ報告して終了コード 1、無ければ件数だけ出して 0。
"""

import re
import subprocess
import sys
from pathlib import Path

from ts_sources import DEFAULT_ROOT, report

# 走査する綴り。`.ts` / `.tsx` はコメントだけを、`.md` は全文を見る。
CODE_SUFFIXES = (".ts", ".tsx")
DOC_SUFFIX = ".md"

# 走査しない綴り。どちらも意図した取りこぼし（上の「意図した取りこぼし」）。
SKIPPED_FILE = ".claude/hooks/README.md"
SKIPPED_PREFIX = "harness/records/"

# パスらしい綴り。`/` を 1 つ以上含む、パスに使える文字の連なり。
PATH = re.compile(r"[@A-Za-z0-9_.-]+(?:/[@A-Za-z0-9_.-]+)+")

# `@/` エイリアス（`tsconfig.json` / `vite.config.ts` で `src/` を指す）。
ALIAS = "@/"

# 綴りの前後に付く、パスの一部ではない文字。
TRIMMED = "./"

# 切れたプレースホルダ（`pr-<番号>.md`）の末尾。
PLACEHOLDER_TAIL = "-"

# フォルダ名・ファイル名として書かれうるセグメント。PascalCase を含むものは名前なので外れる。
FOLDER_SEGMENT = re.compile(r"^[a-z0-9_.@-]+$")

# 末尾セグメントの接頭辞一致を認める区切り。`01` が `01-file-format.md` を、`test-setup` が
# `test-setup.ts` を、`Design` が `Design Composer.html` を指す形がある。
BOUNDARIES = "-. "


def comment_lines(text: str) -> list[tuple[int, str]]:
    """TypeScript のソースから、コメントの中身だけを行番号付きで取り出す。

    文字列リテラルの中は見ない。テンプレートリテラルをコメントより先に畳むと、
    `/* `features/assets` が持つ契約。 */` のようにバッククォートで囲んだ綴りが
    丸ごと消える（#690 の 14 箇所のうち 1 箇所がこの形）。

    @param text ソースの全文
    @returns `(行番号, コメントの中身)` の並び。1 行に 2 つあれば 2 件になる
    """
    code, block, single, double, template = range(5)
    found: list[tuple[int, str]] = []
    state = code
    for number, line in enumerate(text.split("\n"), 1):
        index = 0
        start = 0 if state == block else None
        while index < len(line):
            pair = line[index : index + 2]
            char = line[index]
            if state == code:
                if pair == "//":
                    found.append((number, line[index + 2 :]))
                    index = len(line)
                elif pair == "/*":
                    state, start, index = block, index + 2, index + 2
                else:
                    state = {"'": single, '"': double, "`": template}.get(char, code)
                    index += 1
            elif state == block:
                if pair == "*/":
                    found.append((number, line[start:index]))
                    state, start, index = code, None, index + 2
                else:
                    index += 1
            elif char == "\\":
                index += 2
            else:
                closing = {single: "'", double: '"', template: "`"}[state]
                state = code if char == closing else state
                index += 1
        if state == block:
            found.append((number, line[start or 0 :]))
        elif state in (single, double):
            # 行をまたぐ文字列リテラルは無い（lint が通らない）ので、行末で戻す。
            state = code
    return found


def doc_lines(text: str) -> list[tuple[int, str]]:
    """Markdown の全文を、行番号付きで取り出す。

    @param text Markdown の全文
    @returns `(行番号, 行)` の並び
    """
    return list(enumerate(text.split("\n"), 1))


def scanned_files(root: Path) -> list[str]:
    """走査の対象になるファイルを、git が追跡しているものから集める。

    フォルダを歩いて集めると、`.gitignore` 済みの生成物（`storybook-static/` /
    `visual-baseline/` / `src-tauri/gen/`）まで対象になり、手元に成果物が残っている環境
    だけで push が止まる。除外するフォルダ名を並べて避ける形も、その一覧が増えるたびに
    検査の範囲が静かに変わる。

    @param root 走査を始めるフォルダ
    @returns リポジトリルートからの `/` 区切りのパスの並び。型宣言（`*.d.ts`）は説明を
        持たないので除く
    """
    listed = subprocess.run(
        ["git", "ls-files", "-z", "--", root.as_posix()],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return sorted(
        path
        for path in listed.split("\0")
        if path.endswith(CODE_SUFFIXES + (DOC_SUFFIX,))
        and not path.endswith(".d.ts")
        and path != SKIPPED_FILE
        and not path.startswith(SKIPPED_PREFIX)
    )


def folder_names() -> set[str]:
    """第 1 セグメントとして認める綴りを、実在するフォルダから導出する。

    トップレベル（`src` `docs` `rules` `harness` …）と `src/` 直下の層
    （`features` `domains` `components` …）の名前。

    @returns フォルダ名の集合
    """
    root = Path(".")
    layers = root / DEFAULT_ROOT
    top = {path.name for path in root.iterdir() if path.is_dir()}
    return top | {path.name for path in layers.iterdir() if path.is_dir()}


def exists(candidate: Path) -> bool:
    """名指しされた綴りに当たる実体があるかを答える。

    @param candidate 解決先の候補のパス
    @returns そのパスがあるか、末尾のセグメントを区切りまでの接頭辞と見たときの実体が
        あれば `True`
    """
    if candidate.exists():
        return True
    if not candidate.parent.is_dir():
        return False
    prefix = candidate.name
    return any(
        entry.name.startswith(prefix) and entry.name[len(prefix) : len(prefix) + 1] in BOUNDARIES
        for entry in candidate.parent.iterdir()
    )


def missing_path(spelling: str, folders: set[str]) -> bool:
    """1 つの綴りが、実体を持たないパスの名指しかを答える。

    @param spelling 説明から取り出した綴り
    @param folders 第 1 セグメントとして認めるフォルダ名
    @returns 実体を持たないパスの名指しなら `True`。パスの名指しでない綴り（相対・名前・
        切れたプレースホルダ）も `False`
    """
    aliased = spelling.startswith(ALIAS)
    relative = spelling.removeprefix(ALIAS).strip(TRIMMED) if aliased else spelling.strip(TRIMMED)
    segments = relative.split("/")
    named = bool(relative) and not segments[-1].endswith(PLACEHOLDER_TAIL)
    if not named or (not aliased and segments[0] not in folders):
        return False
    root = Path(".")
    bases = [root / DEFAULT_ROOT] if aliased else [root, root / DEFAULT_ROOT]
    if any(exists(base / relative) for base in bases):
        return False
    return all(FOLDER_SEGMENT.match(segment) for segment in segments)


def scan(root: Path) -> int:
    """走査ルート配下の説明を集めて、実体を持たないパスの名指しを報告する。

    @param root 走査を始めるフォルダ
    @returns 違反があれば 1、無ければ 0
    """
    paths = scanned_files(root)
    folders = folder_names()
    missing: list[str] = []

    for path in paths:
        text = Path(path).read_text(encoding="utf-8")
        read = doc_lines if path.endswith(DOC_SUFFIX) else comment_lines
        for number, content in read(text):
            for spelling in PATH.findall(content):
                if missing_path(spelling, folders):
                    missing.append(f"{path}:{number}: {spelling}")

    if missing:
        report("named-path-missing", missing)
    print(f"名指ししたパスの違反 {len(missing)} 件 / {len(paths)} ファイル")
    return 1 if missing else 0


if __name__ == "__main__":
    arguments = sys.argv[1:]
    target = Path(arguments[0]) if arguments else Path(".")
    if not target.is_dir():
        print(__doc__)
        sys.exit(2)
    sys.exit(scan(target))
