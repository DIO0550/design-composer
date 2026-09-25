#!/usr/bin/env python3
"""コメント・doc が名指ししているパスが、実体として存在するかを探す。

フォルダを動かしても書き換わるのは `import` だけで、説明の中の綴りは黙って古い位置を
指したまま残る。7 つの子 feature を `features/editor/features/` へ移した回（#679）では、
import 325 箇所が書き換わったのに説明の中の 14 箇所が残り、typecheck も lint も既存の
検出器も 1 件も捕まえなかった（#690）。判例の側にも同じ形が出ている
（`harness/case-law/consistency.md`「検出器の判定表は移動で静かに嘘になる」）。

報告する違反は 1 つ。

- `named-path-missing` — 名指ししている先に実体が無い

**見るのは説明だけで、コードの文字列リテラルは見ない。** `.ts` / `.tsx` はコメントの中、
`.md` は全文（全文が説明なので。例外は下の probe レシピだけ）。`import` の綴りは typecheck が、公開 API を迂回する向きは
`import-rule-violations.py` が既に見ている。

**綴りはリポジトリルートか `src/` からの絶対として解決する。** 祖先フォルダからの相対も
許すと、`src/features/editor/` の中に書かれた `features/sidebar` が
`src/features/editor/features/sidebar` として実在扱いになり、#690 が直した 14 箇所のうち
5 箇所がそのまま素通りする（実測）。

**第 1 セグメントがフォルダ名のものだけを見る。** その一覧はハードコードせず、トップレベルと
`src/` 直下のフォルダ名から導出する。一覧そのものが移動で陳腐化するのでは、この検査が
防ごうとしている形を検査自身が持つことになる。

解決の前に、**先頭の `./` `../` と末尾の `.` `/` を落とす**。Markdown の相対リンクと、
`docs/...` のプレースホルダ・文末の `FilePath.` がここで揃う。**先頭の `.` は落とさない**
（落とすと `.claude/hooks/lib/...` の第 1 セグメントが `claude` になり、このリポジトリで
いちばん相互参照の濃い層が丸ごと検査から外れる）。

実在の判定は 2 手。

1. そのパスがある
2. 末尾のセグメントが、実在する名前の**区切りまでの接頭辞**になっている
   （`docs/01` が `docs/01-file-format.md` を、`src/test-setup` が `src/test-setup.ts` を
   指す形がある）。区切り（`-` `.`）の位置でしか認めないので、`features/token` は
   `features/tokens` で通らない

意図した取りこぼしが 7 つある。

- **PascalCase のセグメントを含む綴りは見ない。ただし末尾が拡張子を持つときは見る。**
  フォルダ名はケバブケースなので `components/ContextMenu` のような綴りは名前（story の
  `title`・コンポーネント名）を指しているが、`src/utils/` は PascalCase 1 ファイルなので
  （`rules/naming.md`「ファイル名」）、`src/utils/Result.ts` は綴りとして見る
- **`-` で終わる綴りは見ない。** `harness/records/pr-<番号>.md` のようなプレースホルダが
  `<` で切れた形で、パスの名指しではない
- **相対の綴りは見ない**（第 1 セグメントがフォルダ名でないもの）
- **相対リンクの段数は見ない。** `../` は落としてルートから解決するので、段数を間違えた
  Markdown リンクは、行き先が実在する限り通る
- **`.claude/hooks/README.md` のフェンスの中の probe は見ない。** 動作確認のレシピが、
  これから作るファイル（`src/app/probe.ts` など）を意図して名指しするため。probe と見るのは、
  セグメントのどれかが `probe` を `-` `.` 区切りの語として持ち（`probe.ts` /
  `internal-probe` / `probe-a.ts`。`probes` は違う）、**その手前までのフォルダが実在する**
  綴りだけ。フェンスの中でもそれ以外の綴りは見る。ファイルを丸ごと外していた間に、レシピが
  移動前のテストファイルを名指ししたまま残っていた（#708）。README 以外のフェンスへ広げない
  のは、該当が 0 件で使われない逃げ道になるため
- **`harness/records/` は走査しない**（`harness/records/README.md`「過去の記録は
  書き換えない」。当時の綴りとして正しい）
- **git が追跡していないファイルは走査しない。** push の時点では差分がコミットされて
  いるのでゲートに穴は開かないが、コミット前の新しいファイルは層 3 でも見えない
  （probe を当てるときは `git add -N` で索引へ入れる）

使い方:
    named-path-violations.py       # 走査するのはリポジトリ全体（引数は取らない）

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

# 走査しないフォルダ。意図した取りこぼし（上の「意図した取りこぼし」）。
SKIPPED_PREFIX = "harness/records/"

# フェンスの中の probe を免除するファイル（上の「意図した取りこぼし」）。
PROBE_RECIPES = ".claude/hooks/README.md"

# Markdown のフェンスの開閉。
FENCE = "```"

# probe の綴り。`-` `.` 区切りの語として `probe` を持つセグメント。
PROBE_SEGMENT = re.compile(r"(?:^|[-.])probe(?:[-.]|$)")

# パスらしい綴り。`/` を 1 つ以上含む、パスに使える文字の連なり。
PATH = re.compile(r"[@A-Za-z0-9_.-]+(?:/[@A-Za-z0-9_.-]+)+")

# `@/` エイリアス（`tsconfig.json` / `vite.config.ts` で `src/` を指す）。
ALIAS = "@/"

# 先頭に付く、行き先を変えない綴り（Markdown の相対リンク）。
LEADING = re.compile(r"^(?:\./|\.\./)+")

# 末尾に付く、パスの一部ではない文字。
TRAILING = "./"

# 切れたプレースホルダ（`pr-<番号>.md`）の末尾。
PLACEHOLDER_TAIL = "-"

# フォルダ名として書かれうるセグメント。PascalCase を含むものは名前なので外れる。
FOLDER_SEGMENT = re.compile(r"^[a-z0-9_.@-]+$")

# 拡張子を持つファイル名。`src/utils/` の PascalCase 1 ファイルがこれに当たる。
FILE_SEGMENT = re.compile(r"^[@A-Za-z0-9_-]+\.[A-Za-z0-9]+$")

# 末尾セグメントの接頭辞一致を認める区切り。`01` が `01-file-format.md` を、`test-setup` が
# `test-setup.ts` を指す形がある。
BOUNDARIES = "-."

# コメントを取り出す状態機械の状態。
Code, Block, Single, Double, Template = range(5)

# コードの中で状態を切り替える綴り。
LineComment = "//"
BlockOpen = "/*"
BlockClose = "*/"
StringStates = {"'": Single, '"': Double, "`": Template}
StringCloses = {Single: "'", Double: '"', Template: "`"}


def read_line(line: str, state: int, start: int) -> tuple[list[str], int, int]:
    """1 行を状態機械で走査し、その行から取れるコメントと行末の状態を返す。

    文字列リテラルの中は見ない。テンプレートリテラルをコメントより先に畳むと、
    `/* `features/assets` が持つ契約。 */` のようにバッククォートで囲んだ綴りが
    丸ごと消える（#690 の 14 箇所のうち 1 箇所がこの形）。

    @param line 走査する 1 行
    @param state 行頭の状態
    @param start 行頭が `Block` のときの、コメントの読み始めの位置
    @returns `(この行から取れたコメントの並び, 行末の状態, 読み始めの位置)`
    """
    found: list[str] = []
    index = 0
    while index < len(line):
        pair = line[index : index + 2]
        char = line[index]
        if state == Code and pair == LineComment:
            found.append(line[index + 2 :])
            index = len(line)
        elif state == Code and pair == BlockOpen:
            state, start, index = Block, index + 2, index + 2
        elif state == Code:
            state, index = StringStates.get(char, Code), index + 1
        elif state == Block and pair == BlockClose:
            found.append(line[start:index])
            state, index = Code, index + 2
        elif state == Block:
            index += 1
        elif char == "\\":
            index += 2
        else:
            state = Code if char == StringCloses[state] else state
            index += 1
    if state == Block:
        found.append(line[start:])
    return found, state, start


def comment_lines(text: str) -> list[tuple[int, str]]:
    """TypeScript のソースから、コメントの中身だけを行番号付きで取り出す。

    @param text ソースの全文
    @returns `(行番号, コメントの中身)` の並び。1 行に 2 つあれば 2 件になる
    """
    found: list[tuple[int, str]] = []
    state, start = Code, 0
    for number, line in enumerate(text.split("\n"), 1):
        start = 0 if state == Block else start
        comments, state, start = read_line(line, state, start)
        found.extend((number, comment) for comment in comments)
        # クォートで囲む文字列は行をまたげない（lint が通らない）ので、行末で戻す。
        # テンプレートリテラルはまたげるので戻さない。
        state = Code if state in (Single, Double) else state
    return found


def doc_lines(text: str) -> list[tuple[int, str]]:
    """Markdown の全文を、行番号付きで取り出す。

    @param text Markdown の全文
    @returns `(行番号, 行)` の並び
    """
    return list(enumerate(text.split("\n"), 1))


def fenced_numbers(text: str) -> set[int]:
    """Markdown のフェンスの中にある行の行番号を集める。

    @param text Markdown の全文
    @returns フェンスの中身の行番号の集合。開閉の行そのものは含めない
    """
    inside = False
    numbers: set[int] = set()
    for number, line in doc_lines(text):
        toggles = line.lstrip().startswith(FENCE)
        if inside and not toggles:
            numbers.add(number)
        inside = inside != toggles
    return numbers


def scanned_files() -> list[str]:
    """走査の対象になるファイルを、git が追跡しているものから集める。

    フォルダを歩いて集めると、`.gitignore` 済みの生成物（`storybook-static/` /
    `visual-baseline/` / `src-tauri/gen/`）まで対象になり、手元に成果物が残っている環境
    だけで push が止まる。除外するフォルダ名を並べて避ける形も、その一覧が増えるたびに
    検査の範囲が静かに変わる。

    @returns リポジトリルートからの `/` 区切りのパスの並び。型宣言（`*.d.ts`）は説明を
        持たないので除く
    """
    listed = subprocess.run(
        ["git", "ls-files", "-z"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return sorted(
        path
        for path in listed.split("\0")
        if path.endswith(CODE_SUFFIXES + (DOC_SUFFIX,))
        and not path.endswith(".d.ts")
        and not path.startswith(SKIPPED_PREFIX)
    )


def folder_names() -> set[str]:
    """第 1 セグメントとして認める綴りを、実在するフォルダから導出する。

    トップレベル（`src` `docs` `rules` `harness` `.claude` …）と `src/` 直下の層
    （`features` `domains` `components` …）の名前。

    @returns フォルダ名の集合
    """
    root = Path(".")
    layers = root / DEFAULT_ROOT
    top = {path.name for path in root.iterdir() if path.is_dir()}
    return top | {path.name for path in layers.iterdir() if path.is_dir()}


def exists(candidate: Path) -> bool:
    """名指しされた先に実体があるかを答える。

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


def spelled_as_path(segments: list[str]) -> bool:
    """その綴りが、名前ではなくパスとして書かれているかを答える。

    @param segments 綴りをセグメントへ分けたもの
    @returns 途中がすべてフォルダ名の形で、末尾がフォルダ名か拡張子付きのファイル名なら
        `True`
    """
    inner = all(FOLDER_SEGMENT.match(segment) for segment in segments[:-1])
    leaf = segments[-1]
    return inner and bool(FOLDER_SEGMENT.match(leaf) or FILE_SEGMENT.match(leaf))


def probe_recipe(spelling: str) -> bool:
    """その綴りが、レシピがこれから作る probe を指しているかを答える。

    @param spelling フェンスの中から取り出した綴り
    @returns セグメントのどれかが probe で、その手前までのフォルダが実在すれば `True`
    """
    segments = LEADING.sub("", spelling.removeprefix(ALIAS)).split("/")
    probes = [index for index, segment in enumerate(segments) if PROBE_SEGMENT.search(segment)]
    if not probes:
        return False
    parent = "/".join(segments[: probes[0]])
    root = Path(".")
    bases = [root / DEFAULT_ROOT] if spelling.startswith(ALIAS) else [root, root / DEFAULT_ROOT]
    return any((base / parent).is_dir() for base in bases)


def missing_path(spelling: str, folders: set[str]) -> bool:
    """1 つの綴りが、実体を持たないパスの名指しかを答える。

    @param spelling 説明から取り出した綴り
    @param folders 第 1 セグメントとして認めるフォルダ名
    @returns 実体を持たないパスの名指しなら `True`。パスの名指しでない綴り（相対・名前・
        切れたプレースホルダ）も `False`
    """
    aliased = spelling.startswith(ALIAS)
    trimmed = LEADING.sub("", spelling.removeprefix(ALIAS) if aliased else spelling)
    relative = trimmed.rstrip(TRAILING)
    segments = relative.split("/")
    named = bool(relative) and not segments[-1].endswith(PLACEHOLDER_TAIL)
    if not named or (not aliased and segments[0] not in folders):
        return False
    root = Path(".")
    bases = [root / DEFAULT_ROOT] if aliased else [root, root / DEFAULT_ROOT]
    if any(exists(base / relative) for base in bases):
        return False
    return spelled_as_path(segments)


def spellings(path: str) -> list[tuple[int, str]]:
    """1 つのファイルの説明から、パスらしい綴りを行番号付きで取り出す。

    @param path 走査するファイルのパス
    @returns `(行番号, 綴り)` の並び。`PROBE_RECIPES` のフェンスの中の probe は含めない
    """
    text = Path(path).read_text(encoding="utf-8")
    read = doc_lines if path.endswith(DOC_SUFFIX) else comment_lines
    fenced = fenced_numbers(text) if path == PROBE_RECIPES else set()
    found = [
        (number, spelling)
        for number, content in read(text)
        for spelling in PATH.findall(content)
    ]
    in_recipes = [(number, spelling) for number, spelling in found if number in fenced]
    probes = {entry for entry in in_recipes if probe_recipe(entry[1])}
    return [entry for entry in found if entry not in probes]


def scan() -> int:
    """リポジトリの説明を集めて、実体を持たないパスの名指しを報告する。

    @returns 違反があれば 1、無ければ 0
    """
    paths = scanned_files()
    folders = folder_names()
    missing = [
        f"{path}:{number}: {spelling}"
        for path in paths
        for number, spelling in spellings(path)
        if missing_path(spelling, folders)
    ]

    if missing:
        report("named-path-missing", missing)
    print(f"名指ししたパスの違反 {len(missing)} 件 / {len(paths)} ファイル")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(scan())
