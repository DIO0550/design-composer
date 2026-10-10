#!/usr/bin/env python3
"""PR の差分から、解説ページの「変更の地図」(`change-map.json`、version 2)を作る。

地図に載せるのは 5 つ。どれも git の差分と中身だけで決まるので、AI ではなく Actions が作る。

- PR のブランチ名(head と base)
- 変更したファイルと、依存の端に出る変更していないファイル(文脈ファイル)を層ごとにまとめ、内側の層から
  外側へ読む順に並べたもの。変更したテストファイルには、それが確かめている対象のファイルを添える
- `__tests__/` のテスト名の増減(テスト名は仕様の文なので、増減がそのまま守る仕様の増減になる)と、テスト名を
  調べたファイルの一覧(ページは、一覧に無いファイルのテストを追加とも既存とも言い切らない)
- コミットごとの件名・本文・作者・日時と、ファイルごとの差分(ページが変更の経緯を出し、解説を書いた
  時点より後に何が変わったかを出すため)
- 端の少なくとも一方が変更ファイルの依存(どのファイルがどのファイルを使っているか)。merge-base と head の
  両方で探し、足した・残った・消えたを分ける。ページが依存の図にする

**依存は 3 通りで拾う。** 使う側は Markdown・バイナリ・長すぎるもの以外のすべてのファイル、使われる側は
すべてのファイル。変更していないファイルどうしの依存は PR と関係が無く、数に上限も無いので載せない。

- TypeScript / JavaScript の import。解決は import 規約の検査と同じ `ts_sources.resolve_import`
  (`@/` と相対パス。拡張子を省いた綴り)
- Python の import(モジュール名の最後の部分と同じ名前の `.py`)
- ファイルの中に別のファイルのパスが書かれていること(ワークフローがスクリプトを呼ぶ・
  スクリプトがテンプレートを読む、など言語をまたぐ参照)。リポジトリのルートからのパスのほか、
  `$dir/…` `${dir}/…` `$(dirname "$0")/…` で始まるものは、使う側のフォルダからの相対として解く
  (このリポジトリのシェルは、自分のフォルダを変数に入れて隣やサブフォルダを呼ぶ)。同じフォルダの
  ファイルはファイル名だけでも数える(`index.*` は名前がありふれているので数えない)

コメント(行頭・行末・`/* */`)・Python の docstring・Markdown の言及は、説明であって依存ではないので
数えない(「理由は x を見る」が逆向きの依存に化ける)。**文字列の中の言及は拾う。** 実行時に読む
パスと、メッセージに書いただけのパスを見分けられないため。

**差分の起点は base の先端ではなく merge-base。** PR の画面の「Files changed」と同じ範囲にする。

**テスト名の増減は差分の行ではなく、前後のファイルの中身から抜いて集合で比べる。** 行で見ると、
ファイルの rename・中身だけの変更・`test.each(...)(` の改行の位置で、同じテストが
「削除 + 追加」に化ける。

使い方:
    build-pr-change-map.py --base <sha> --head <sha> --pr <番号> --head-branch <名前> --base-branch <名前>

標準出力へ JSON を出す。git が失敗したら終了コード 1、引数の誤りは 2。
"""

import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path
from typing import NamedTuple

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".claude/hooks/lib"))
from ts_sources import COMMENT_LINE, DEFAULT_ROOT, DOMAINS_ROOT, IMPORT_SPECIFIER, INDEX_NAMES, feature_of, resolve_import

# 層の読む順。内側(依存される側)から外側へ。`src/domains` のカテゴリは import してよい向き
# (`rules/architecture.md`「domains のカテゴリ」)の順に並べ、`src/features` を挟んで
# 内側の層と外側の層を置く。
DomainCategories = ("unit", "dcmp", "compiled", "session")
InnerLayers = tuple((name, f"{DEFAULT_ROOT}/{name}") for name in ("services", "libs", "utils", "types"))
OuterLayers = tuple((name, f"{DEFAULT_ROOT}/{name}") for name in ("components", "hooks", "app"))
HarnessPaths = ("AGENTS.md", "CLAUDE.md", "rules/", ".claude/", ".github/", "harness/")

TestFolder = "/__tests__/"
TestFile = re.compile(re.escape(TestFolder) + r".*\.test\.tsx?$")
StoryFile = re.compile(r"\.stories\.tsx?$")

# `test(` / `it(` と、その修飾(`.skip` `.only` など)と `.each`。`regex.test(` や `split(` を
# 拾わないよう、直前が識別子の文字や `.` でないことを求める。
TestCall = re.compile(r"(?<![\w$.])(?:test|it)(?:\.(?:skip|only|todo|concurrent|fails|sequential))*(\.each)?\s*\(")
Quote = re.compile(r"\s*(['\"`])")
OpeningParen = re.compile(r"\s*\(")
StatusLetters = {"A": "A", "M": "M", "D": "D", "R": "R", "C": "A", "T": "M"}

ScriptSuffixes = (".ts", ".tsx", ".js", ".mjs", ".jsx")
PythonImport = re.compile(r"^[ \t]*(?:from\s+([\w.]+)\s+import\b|import\s+([\w.]+))", re.M)
# 説明として落とすもの。`#` だけの行(TS の行頭のコメントは `ts_sources.COMMENT_LINE`)、行末の
# `#` / `//` のコメント(前後に空白があるものだけ。URL の `//` やシェルの `$#` を落とさない)、
# `/* */`(JSX の `{/* */}` を含む)、Python の docstring。
HashCommentLine = re.compile(r"^\s*#")
TrailingComment = re.compile(r"[ \t]+(?:#|//)[ \t].*$", re.M)
BlockComment = re.compile(r"/\*[\s\S]*?\*/")
Docstring = re.compile(r'("""|\'\'\')[\s\S]*?\1')
# パスとして読める字句(フォルダをシェル変数で書いた `$dir/x.py` `${dir}/x.py` を含む)と、その変数の前置き。
PathToken = re.compile(r"[\w./${}-]+")
VariablePrefix = re.compile(r"^\$\{?\w+\}?/")
# これより長い(文字数)ファイルは依存を探しに読まない(生成物のフィクスチャなどで地図づくりを遅らせない)。
MaxSourceCharacters = 1_000_000
# 先頭のこのバイト数に NUL があればバイナリとみなす(git が差分でバイナリとみなすのと同じ幅)。
BinaryProbeBytes = 8000
# コミットのファイルごとの差分は、この行数で切る。
MaxPatchLines = 2000
# コミットの読み出し。`git log -z` はコミットの間に NUL を挟むので、欄も NUL で区切れば 6 つずつに割れる。
CommitFields = ("%H", "%P", "%an", "%aI", "%s", "%b")
CommitFormat = "%x00".join(CommitFields)
# 引数の名前。どれも必須。
Options = ("--base", "--head", "--pr", "--head-branch", "--base-branch")


class PullRequest(NamedTuple):
    """地図を作る PR。

    `base` / `head` はコミットを指す綴り(sha か ref)、`base_branch` / `head_branch` は地図に載せるブランチ名。
    """

    number: int
    base: str
    head: str
    base_branch: str
    head_branch: str


class PathLookup(NamedTuple):
    """ある時点で依存の行き先になりうるファイルと、それを名前から引く表。

    `siblings` はフォルダ → ファイル名 → パス(`index.*` を除く)、`modules` は `.py` のモジュール名 → パス。
    """

    paths: frozenset[str]
    siblings: dict[str, dict[str, str]]
    modules: dict[str, frozenset[str]]


def git(*args: str) -> str:
    """git を走らせて標準出力を返す。失敗したら例外のまま落とす(地図を半端に作らない)。

    UTF-8 として読めないバイトは置き換える(Shift_JIS のファイルや壊れたフィクスチャが 1 つあるだけで、
    地図全体を作れなくしない)。
    """
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True, errors="replace").stdout


def read_string(text: str, start: int) -> tuple[str, int] | None:
    """`start` から始まる文字列リテラルを読む。

    @param text ファイルの中身
    @param start 引用符の位置
    @returns (中身, 閉じ引用符の次の位置)。閉じていなければ None
    """
    quote = text[start]
    index = start + 1
    chars: list[str] = []
    while index < len(text):
        char = text[index]
        if char == "\\":
            chars.append(text[index : index + 2])
            index += 2
            continue
        if char == quote:
            return "".join(chars), index + 1
        chars.append(char)
        index += 1
    return None


def skip_parens(text: str, start: int) -> int | None:
    """`start`(開き括弧の直後)から、対応する閉じ括弧の次の位置を返す。文字列の中の括弧は数えない。

    @returns 対応する閉じ括弧が無ければ None
    """
    depth = 1
    index = start
    while index < len(text):
        char = text[index]
        if char in "'\"`":
            literal = read_string(text, index)
            if literal is None:
                return None
            index = literal[1]
            continue
        depth += {"(": 1, ")": -1}.get(char, 0)
        index += 1
        if depth == 0:
            return index
    return None


def name_position_after_table(text: str, start: int) -> int | None:
    """`test.each(<表>)(` の、テスト名が始まる位置を返す。

    @param start `.each(` の開き括弧の直後
    @returns 2 つ目の開き括弧の直後。表が閉じていない・2 つ目の括弧が無ければ None
    """
    after_table = skip_parens(text, start)
    if after_table is None:
        return None
    opening = OpeningParen.match(text, after_table)
    return opening.end() if opening else None


def test_name_at(text: str, call: re.Match[str]) -> str | None:
    """1 つの `test(` / `it(` 呼び出しからテスト名を読む。

    @returns テスト名。名前が文字列リテラルで始まらない呼び出しなら None
    """
    position = call.end()
    if call.group(1):
        position = name_position_after_table(text, position)
    if position is None:
        return None
    quote = Quote.match(text, position)
    if quote is None:
        return None
    literal = read_string(text, quote.end() - 1)
    return literal[0] if literal else None


def test_names(text: str) -> set[str]:
    """テストファイルの中身から、テスト名の集合を抜く。"""
    names = (test_name_at(text, call) for call in TestCall.finditer(text))
    return {name for name in names if name is not None}


def changed_files(base: str, head: str) -> list[dict]:
    """base..head で変わったファイルを、rename を 1 件にまとめて返す。"""
    statuses = git("diff", "-z", "-M", "--name-status", base, head).split("\0")
    counts = git("diff", "-z", "-M", "--numstat", base, head).split("\0")
    files: list[dict] = []
    index = 0
    while index < len(statuses) - 1:
        letter = statuses[index][0]
        renamed = letter in "RC"
        old_path = statuses[index + 1]
        path = statuses[index + 2] if renamed else old_path
        files.append({"path": path, "status": StatusLetters.get(letter, letter), "oldPath": old_path if letter == "R" else None})
        index += 3 if renamed else 2
    line_counts = numstat_by_path(counts)
    for file in files:
        file["additions"], file["deletions"] = line_counts[file["path"]]
    return files


def numstat_by_path(fields: list[str]) -> dict[str, tuple[int | None, int | None]]:
    """`--numstat -z` の出力を、新しいパスごとの追加・削除行数にする。バイナリは行数が無いので None。

    rename の行は `追加\\t削除\\t` の後に旧パスと新パスが別のフィールドで続く。
    """
    counts: dict[str, tuple[int | None, int | None]] = {}
    index = 0
    while index < len(fields) - 1:
        added, deleted, path = fields[index].split("\t", 2)
        step = 1
        if path == "":
            path = fields[index + 2]
            step = 3
        counts[path] = (int(added) if added.isdigit() else None, int(deleted) if deleted.isdigit() else None)
        index += step
    return counts


def layer_of(path: str) -> tuple[int, str, str]:
    """ファイルが属する層を、読む順の位置・層の見出し・層の中での並べ替えの鍵で返す。"""
    if path.startswith(f"{DOMAINS_ROOT}/"):
        category = path.split("/")[2]
        rank = DomainCategories.index(category) if category in DomainCategories else len(DomainCategories)
        return rank, f"domains / {category}", ""
    rank = len(DomainCategories) + 1
    for name, root in InnerLayers:
        if path.startswith(f"{root}/"):
            return rank, name, ""
        rank += 1
    feature = feature_of(path)
    if feature is not None:
        return rank, f"features / {feature}", feature
    rank += 1
    for name, root in OuterLayers:
        if path.startswith(f"{root}/"):
            return rank, name, ""
        rank += 1
    return unlayered_area_of(path, rank)


def unlayered_area_of(path: str, rank: int) -> tuple[int, str, str]:
    """`src/` のどの層にも入らないファイルの置き場を、`layer_of` と同じ形で返す。"""
    if path.startswith(f"{DEFAULT_ROOT}/"):
        return rank, "src(その他)", ""
    if path.startswith("src-tauri/"):
        return rank + 1, "src-tauri", ""
    if path.startswith("docs/"):
        return rank + 2, "docs", ""
    if path.startswith(HarnessPaths):
        return rank + 3, "ハーネス", ""
    return rank + 4, "その他", ""


def kind_of(path: str) -> int:
    """層の中での並び。本体 → テスト(共有のセットアップを含む)→ story の順にする。"""
    if TestFolder in path:
        return 1
    if StoryFile.search(path):
        return 2
    return 0


def target_of(path: str, paths: frozenset[str]) -> str | None:
    """テストファイルが確かめている対象のファイルを返す。

    `__tests__/` の親フォルダの `index.ts(x)` を探し、無ければ同じフォルダから、テストファイル名の先頭
    (`Result.normal.test.ts` なら `Result`)と同じ名前の `.ts(x)` を探す。

    @param path 変更ファイルのパス
    @param paths head のすべてのファイル
    @returns 対象のパス。テストファイルでないか、どちらも無ければ None
    """
    if not TestFile.search(path):
        return None
    folder = path[: path.rindex(TestFolder)]
    stem = posixpath.basename(path).split(".")[0]
    candidates = [*INDEX_NAMES, f"{stem}.ts", f"{stem}.tsx"]
    return next((f"{folder}/{name}" for name in candidates if f"{folder}/{name}" in paths), None)


def listed_files(files: list[dict], dependencies: list[dict], paths: frozenset[str]) -> list[dict]:
    """層に載せるファイルを返す。変更ファイルと、依存の端に出る変更していないファイル(文脈ファイル)。

    @param files 変更ファイル(`changed_files` の戻り値)
    @param dependencies `dependencies_between` の戻り値
    @param paths head のすべてのファイル(テストの対象を探す範囲)
    @returns 変更ファイルは `changed: true` と `target`(`target_of` の戻り値)を足したもの。文脈ファイルは
        `{"path": パス, "changed": false}`
    """
    changed = [{**file, "changed": True, "target": target_of(file["path"], paths)} for file in files]
    changed_paths = {file["path"] for file in files}
    endpoints = {dependency[end] for dependency in dependencies for end in ("from", "to")}
    context = [{"path": path, "changed": False} for path in sorted(endpoints - changed_paths)]
    return changed + context


def group_files(files: list[dict]) -> list[dict]:
    """層に載せるファイル(`listed_files` の戻り値)を層ごとにまとめ、読む順に並べる。"""
    groups: dict[tuple[int, str, str], list[dict]] = {}
    for file in files:
        groups.setdefault(layer_of(file["path"]), []).append(file)
    return [
        {"label": label, "files": sorted(members, key=lambda file: (kind_of(file["path"]), file["path"]))}
        for (_, label, _), members in sorted(groups.items())
    ]


def test_changes(files: list[dict], before: dict[str, str | None], after: dict[str, str | None]) -> dict[str, list]:
    """テストファイルごとに、前後のテスト名の集合を比べて増減を出す。

    中身は依存を探すときに読んだものを使う(`MaxSourceCharacters` を超えるファイルは読まないので、テスト名も拾わない)。

    @param files 変更ファイル(`changed_files` の戻り値)
    @param before merge-base のすべてのファイル(`snapshots_at` の戻り値)
    @param after head のすべてのファイル
    @returns 増えたテスト(`added`)と減ったテスト(`removed`)の `{file, name}`、テスト名を調べたファイルのパス(`files`)
    """
    examined = [file for file in files if TestFile.search(file["path"]) or TestFile.search(file["oldPath"] or file["path"])]
    added: list[dict] = []
    removed: list[dict] = []
    for file in examined:
        names_before = test_names(before.get(file["oldPath"] or file["path"]) or "")
        names_after = test_names(after.get(file["path"]) or "")
        added += [{"file": file["path"], "name": name} for name in sorted(names_after - names_before)]
        removed += [{"file": file["path"], "name": name} for name in sorted(names_before - names_after)]
    return {"added": added, "removed": removed, "files": [file["path"] for file in examined]}




def tree_at(revision: str) -> dict[str, str]:
    """ある時点のファイルを、パス → blob の名前の対応で返す(サブモジュールは除く)。"""
    entries = (entry.split("\t", 1) for entry in git("ls-tree", "-r", "-z", revision).split("\0")[:-1])
    return {path: meta.split(" ")[2] for meta, path in entries if meta.split(" ")[1] == "blob"}


def read_blobs(names: set[str]) -> dict[str, bytes]:
    """blob の中身を、`git cat-file --batch` を 1 回だけ走らせて読む。

    @param names blob の名前
    @returns 名前 → 中身
    """
    request = "".join(f"{name}\n" for name in sorted(names)).encode()
    output = subprocess.run(["git", "cat-file", "--batch"], input=request, check=True, capture_output=True).stdout
    blobs: dict[str, bytes] = {}
    position = 0
    while position < len(output):
        header_end = output.index(b"\n", position)
        name, _, size = output[position:header_end].decode().split(" ")
        start = header_end + 1
        blobs[name] = output[start : start + int(size)]
        position = start + int(size) + 1
    return blobs


def is_prose(path: str) -> bool:
    """Markdown か(説明の文章なので、依存を探しに読まない)。"""
    return path.endswith(".md")


def source_text(path: str, content: bytes | None) -> str | None:
    """依存を探しに読む中身を返す。

    @param path ファイルのパス
    @param content その中身。読んでいなければ None
    @returns UTF-8 として読んだ中身(読めないバイトは `git` と同じ理由で置き換える)。Markdown・バイナリ・
        `MaxSourceCharacters` を超えるものは None
    """
    unreadable = content is None or is_prose(path) or b"\0" in content[:BinaryProbeBytes]
    if unreadable:
        return None
    text = content.decode("utf-8", errors="replace")
    return text if len(text) <= MaxSourceCharacters else None


def snapshots_at(merge_base: str, head: str) -> tuple[dict[str, str | None], dict[str, str | None]]:
    """merge-base と head のすべてのファイルを、依存を探しに読む中身とともに返す。

    中身は 2 つの時点をまとめて 1 回で読む(同じ blob は 1 度だけ)。

    @returns (merge-base, head) のそれぞれで、パス → `source_text` の戻り値
    """
    trees = (tree_at(merge_base), tree_at(head))
    blobs = read_blobs({name for tree in trees for path, name in tree.items() if not is_prose(path)})
    before, after = ({path: source_text(path, blobs.get(name)) for path, name in tree.items()} for tree in trees)
    return before, after


def lookup_of(paths: frozenset[str]) -> PathLookup:
    """ある時点のすべてのファイルから、依存の行き先を名前で引く表を作る。"""
    siblings: dict[str, dict[str, str]] = {}
    modules: dict[str, set[str]] = {}
    for path in paths:
        name = posixpath.basename(path)
        if not name.startswith("index."):
            siblings.setdefault(posixpath.dirname(path), {})[name] = path
        if name.endswith(".py"):
            modules.setdefault(name[:-3], set()).add(path)
    return PathLookup(paths, siblings, {module: frozenset(found) for module, found in modules.items()})


def imported_paths(source: str, text: str, lookup: PathLookup) -> set[str]:
    """TS / JS の import が指すファイルを返す(解決は import 規約の検査と同じ)。

    @param source import している側のパス
    @param text その中身(説明を落とした後)
    @param lookup 同じ時点のファイル
    """
    resolved = (resolve_import(match.group(1), source, lookup.paths) for match in IMPORT_SPECIFIER.finditer(text))
    return {path for path in resolved if path is not None}


def python_imported_paths(text: str, lookup: PathLookup) -> set[str]:
    """Python の import が指すファイル(モジュール名の最後の部分と同じ名前の `.py`)を返す。

    @param text import している側の中身(説明を落とした後)
    @param lookup 同じ時点のファイル
    """
    modules = {(match.group(1) or match.group(2)).split(".")[-1] for match in PythonImport.finditer(text)}
    return {path for module in modules for path in lookup.modules.get(module, frozenset())}


def code_of(source: str, text: str) -> str:
    """依存を探す範囲を返す。説明(コメント・docstring)を落とした中身。

    @param source 中身を読んだファイル(拡張子で、落とすものを決める)
    @param text その中身
    """
    code = Docstring.sub("", text) if source.endswith(".py") else text
    code = BlockComment.sub("", code) if source.endswith(ScriptSuffixes) else code
    lines = (line for line in code.split("\n") if not (COMMENT_LINE.match(line) or HashCommentLine.match(line)))
    return TrailingComment.sub("", "\n".join(lines))


def referenced_path(source: str, token: str, after_subshell: bool) -> str:
    """パスとして読める字句が指すパスを返す。

    `$dir/` `${dir}/` で始まるもの、`$(dirname "$0")` の直後の `/…` は、使う側のフォルダからの相対として解く。
    それ以外はそのまま(リポジトリのルートからのパスか、ファイル名だけ)。

    @param source 中身を読んだファイル
    @param token 字句
    @param after_subshell 字句の直前が `)` で、`/` から始まっているか
    """
    folder = posixpath.dirname(source)
    if after_subshell:
        return posixpath.normpath(posixpath.join(folder, token[1:]))
    if VariablePrefix.match(token):
        return posixpath.normpath(posixpath.join(folder, VariablePrefix.sub("", token)))
    return token




def mentioned_paths(source: str, text: str, lookup: PathLookup) -> set[str]:
    """中身にパスとして書かれているファイルを返す。

    字句の切れ目で分けるので、別のパスの一部(`x.py` に対する `ax.py`)には当たらない。本文は 1 回だけ
    走査する(ファイルの数だけ走査し直すと、Actions の時間を食う)。

    @param source 中身を読んだファイル
    @param text その中身(説明を落とした後)
    @param lookup 同じ時点のファイル
    """
    siblings = lookup.siblings.get(posixpath.dirname(source), {})
    found = set()
    for match in PathToken.finditer(text):
        token = match.group(0)
        after_subshell = token.startswith("/") and match.start() > 0 and text[match.start() - 1] == ")"
        variable_relative = VariablePrefix.sub("", token)
        candidates = {token, referenced_path(source, token, after_subshell), variable_relative}
        found.update(candidates & lookup.paths)
        if token in siblings:
            found.add(siblings[token])
    return found


def used_paths(source: str, content: str, lookup: PathLookup) -> set[str]:
    """1 つのファイルが使っているファイルを、3 通りの拾い方(module の docstring)を合わせて返す。

    @param source 使う側のパス
    @param content その中身(`source_text` の戻り値)
    @param lookup 同じ時点のファイル
    """
    text = code_of(source, content)
    imported = imported_paths(source, text, lookup) if source.endswith(ScriptSuffixes) else set()
    imported_python = python_imported_paths(text, lookup) if source.endswith(".py") else set()
    return imported | imported_python | mentioned_paths(source, text, lookup)


def edges_in(snapshot: dict[str, str | None]) -> set[tuple[str, str]]:
    """ある時点の、使う側 → 使われる側の組をすべて返す(自分自身への組は除く)。

    @param snapshot パス → 依存を探しに読む中身(`snapshots_at` の戻り値の片方)
    """
    lookup = lookup_of(frozenset(snapshot))
    edges = set()
    for source, content in snapshot.items():
        if content is None:
            continue
        edges.update((source, used) for used in used_paths(source, content, lookup) if used != source)
    return edges


def edges_touching(edges: set[tuple[str, str]], paths: set[str]) -> set[tuple[str, str]]:
    """端の少なくとも一方が `paths` に入る組だけを返す。"""
    return {edge for edge in edges if edge[0] in paths or edge[1] in paths}


def dependencies_between(files: list[dict], before: dict[str, str | None], after: dict[str, str | None]) -> list[dict]:
    """端の少なくとも一方が変更ファイルの依存を、merge-base から head への変化とともに返す。

    @param files 変更ファイル(`changed_files` の戻り値)
    @param before merge-base のすべてのファイル(`snapshots_at` の戻り値)
    @param after head のすべてのファイル
    @returns `{"from": 使う側, "to": 使われる側, "status": 変化}` の並び。変化は head にだけあれば `added`、両方に
        あれば `kept`、merge-base にだけあれば `removed`。merge-base 側の端は、rename の新しいパスに付け替えてから比べる
    """
    renamed = {file["oldPath"]: file["path"] for file in files if file["oldPath"]}
    changed_after = {file["path"] for file in files}
    changed_before = {file["oldPath"] or file["path"] for file in files}
    edges_after = edges_touching(edges_in(after), changed_after)
    edges_before = {
        (renamed.get(source, source), renamed.get(used, used))
        for source, used in edges_touching(edges_in(before), changed_before)
    }
    removed = {edge: "removed" for edge in edges_before - edges_after}
    added = {edge: "added" for edge in edges_after - edges_before}
    kept = {edge: "kept" for edge in edges_after & edges_before}
    statuses = removed | added | kept
    return [{"from": source, "to": used, "status": statuses[(source, used)]} for source, used in sorted(statuses)]


def hunk_lines(diff: str) -> list[str]:
    """`git diff` の出力から、最初の hunk の見出し(`@@`)から後の行を返す。hunk が無ければ空。"""
    lines = diff.removesuffix("\n").split("\n")
    start = next((index for index, line in enumerate(lines) if line.startswith("@@")), len(lines))
    return lines[start:]


def patch_of(sha: str, file: dict) -> dict:
    """コミットでの 1 ファイルの差分を返す。

    @param sha コミット(親が 1 つ)
    @param file そのコミットの変更ファイル(`changed_files` の要素)
    @returns `patch`(最初の `@@` から `MaxPatchLines` 行まで。hunk が無ければ空文字。消したファイルとバイナリは
        None)・`patchLines`(切る前の行数。patch が None なら 0)・`truncated`(切ったか)
    """
    has_no_patch = file["status"] == "D" or file["additions"] is None
    if has_no_patch:
        return {"patch": None, "patchLines": 0, "truncated": False}
    paths = (file["oldPath"], file["path"]) if file["oldPath"] else (file["path"],)
    diff = git("--literal-pathspecs", "diff", "-M", "--no-color", "--no-ext-diff", f"{sha}^", sha, "--", *paths)
    lines = hunk_lines(diff)
    return {"patch": "\n".join(lines[:MaxPatchLines]), "patchLines": len(lines), "truncated": len(lines) > MaxPatchLines}


def commit_files(sha: str) -> list[dict]:
    """親が 1 つのコミットで変わったファイルを、差分とともにパスの順で返す。"""
    files = changed_files(f"{sha}^", sha)
    return sorted(({**file, **patch_of(sha, file)} for file in files), key=lambda file: file["path"])


def commit_of(record: list[str]) -> dict:
    """`git log` の 1 コミット分の欄(`CommitFields` の順)から、地図のコミットを作る。"""
    sha, parents, author, date, subject, body = record
    merge = len(parents.split()) > 1
    files = [] if merge else commit_files(sha)
    return {"sha": sha, "merge": merge, "author": author, "date": date, "subject": subject, "body": body.rstrip("\n"), "files": files}


def commits_between(base: str, head: str) -> list[dict]:
    """base..head のコミットを、親を子より前に置いたうえで古い順に返す。

    @returns コミットごとに sha・マージか(親が 2 つ以上)・作者・作者の日時(ISO 8601)・件名・本文・変更ファイル。
        マージコミットは変更ファイルを持たない
    """
    fields = git("log", "-z", "--date-order", "--reverse", f"--format={CommitFormat}", f"{base}..{head}").split("\0")
    size = len(CommitFields)
    return [commit_of(fields[start : start + size]) for start in range(0, len(fields) - size + 1, size)]


def build_map(pr: PullRequest) -> dict:
    """change-map.json の中身を作る。

    @param pr 地図を作る PR
    @returns 地図。`mergeBase` は base の先端ではなく head との分岐点。変更が無ければ各一覧は空配列
    """
    head = git("rev-parse", pr.head).strip()
    merge_base = git("merge-base", pr.base, head).strip()
    files = changed_files(merge_base, head)
    before, after = snapshots_at(merge_base, head)
    dependencies = dependencies_between(files, before, after)
    return {
        "version": 2,
        "pr": pr.number,
        "headBranch": pr.head_branch,
        "baseBranch": pr.base_branch,
        "mergeBase": merge_base,
        "head": head,
        "groups": group_files(listed_files(files, dependencies, frozenset(after))),
        "tests": test_changes(files, before, after),
        "commits": commits_between(merge_base, head),
        "dependencies": dependencies,
    }



def main(argv: list[str]) -> int:
    args = dict(zip(argv[1::2], argv[2::2]))
    complete = len(argv) == 1 + 2 * len(Options) and set(args) == set(Options) and args["--pr"].isdigit()
    if not complete:
        print("使い方: build-pr-change-map.py --base <sha> --head <sha> --pr <番号> --head-branch <名前> --base-branch <名前>", file=sys.stderr)
        return 2
    pr = PullRequest(int(args["--pr"]), args["--base"], args["--head"], args["--base-branch"], args["--head-branch"])
    try:
        change_map = build_map(pr)
    except subprocess.CalledProcessError as error:
        stderr = error.stderr.decode(errors="replace") if isinstance(error.stderr, bytes) else error.stderr
        print(f"git が失敗しました: {' '.join(error.cmd)}\n{stderr}", file=sys.stderr)
        return 1
    json.dump(change_map, sys.stdout, ensure_ascii=False, indent=2)
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
