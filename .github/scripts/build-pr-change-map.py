#!/usr/bin/env python3
"""PR の差分から、解説ページの「変更の地図」(`change-map.json`)を作る。

地図に載せるのは 4 つ。どれも git の差分と中身だけで決まるので、AI ではなく Actions が作る。

- 変更したファイルを層ごとにまとめ、内側の層から外側へ読む順に並べたもの
- `__tests__/` のテスト名の増減(テスト名は仕様の文なので、増減がそのまま守る仕様の増減になる)
- コミットごとの変更ファイル(解説を書いた時点より後に何が変わったかをページ側で出すため)
- 変更ファイルどうしの依存(どのファイルがどのファイルを使っているか。ページが依存の図にする)

**依存は 3 通りで拾う。**

- TypeScript / JavaScript の import。解決は import 規約の検査と同じ `ts_sources.resolve_import`
  (`@/` と相対パス。拡張子を省いた綴り)
- Python の import(モジュール名の最後の部分と同じ名前の `.py`)
- ファイルの中に別の変更ファイルのパスが書かれていること(ワークフローがスクリプトを呼ぶ・
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
    build-pr-change-map.py --base <sha> --head <sha> --pr <番号>

標準出力へ JSON を出す。git が失敗したら終了コード 1、引数の誤りは 2。
"""

import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".claude/hooks/lib"))
from ts_sources import COMMENT_LINE, DEFAULT_ROOT, DOMAINS_ROOT, IMPORT_SPECIFIER, feature_of, resolve_import

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


def file_at(revision: str, path: str) -> str:
    """ある時点のファイルの中身を返す。"""
    return git("show", f"{revision}:{path}")


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


def group_files(files: list[dict]) -> list[dict]:
    """変更ファイルを層ごとにまとめ、読む順に並べる。"""
    groups: dict[tuple[int, str, str], list[dict]] = {}
    for file in files:
        groups.setdefault(layer_of(file["path"]), []).append(file)
    return [
        {"label": label, "files": sorted(members, key=lambda file: (kind_of(file["path"]), file["path"]))}
        for (_, label, _), members in sorted(groups.items())
    ]


def test_changes(files: list[dict], base: str, head: str) -> dict[str, list[dict]]:
    """テストファイルごとに、前後のテスト名の集合を比べて増減を出す。"""
    added: list[dict] = []
    removed: list[dict] = []
    for file in files:
        old_path = file["oldPath"] or file["path"]
        is_test = TestFile.search(file["path"]) or TestFile.search(old_path)
        if not is_test:
            continue
        before = test_names(file_at(base, old_path)) if file["status"] != "A" else set()
        after = test_names(file_at(head, file["path"])) if file["status"] != "D" else set()
        added += [{"file": file["path"], "name": name} for name in sorted(after - before)]
        removed += [{"file": file["path"], "name": name} for name in sorted(before - after)]
    return {"added": added, "removed": removed}


def import_targets(source: str, text: str, paths: set[str]) -> set[str]:
    """TS / JS の import が指す変更ファイルを返す(解決は import 規約の検査と同じ)。

    @param source import している側のパス
    @param text その中身(説明を落とした後)
    @param paths 変更ファイル(消したものを除く)
    """
    targets = (resolve_import(match.group(1), source, paths) for match in IMPORT_SPECIFIER.finditer(text))
    return {target for target in targets if target is not None}


def python_import_targets(text: str, paths: set[str]) -> set[str]:
    """Python の import が指す変更ファイル(モジュール名の最後の部分と同じ名前の `.py`)を返す。

    @param text import している側の中身(説明を落とした後)
    @param paths 変更ファイル(消したものを除く)
    """
    modules = {(match.group(1) or match.group(2)).split(".")[-1] for match in PythonImport.finditer(text)}
    return {path for path in paths if path.endswith(".py") and posixpath.basename(path)[:-3] in modules}


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


def mentioned_paths(source: str, text: str, paths: set[str]) -> set[str]:
    """中身にパスとして書かれている変更ファイルを返す。

    字句の切れ目で分けるので、別のパスの一部(`x.py` に対する `ax.py`)には当たらない。本文は 1 回だけ
    走査する(変更ファイルの数だけ走査し直すと、大きな PR で Actions の時間を食う)。

    @param source 中身を読んだファイル
    @param text その中身(説明を落とした後)
    @param paths 変更ファイル(消したものを除く)
    """
    folder = posixpath.dirname(source)
    siblings = {posixpath.basename(path): path for path in paths if posixpath.dirname(path) == folder and not posixpath.basename(path).startswith("index.")}
    found = set()
    for match in PathToken.finditer(text):
        token = match.group(0)
        after_subshell = token.startswith("/") and match.start() > 0 and text[match.start() - 1] == ")"
        variable_relative = VariablePrefix.sub("", token)
        candidates = {token, referenced_path(source, token, after_subshell), variable_relative}
        found.update(candidates & paths)
        if token in siblings:
            found.add(siblings[token])
    return found


def dependencies_between(files: list[dict], head: str) -> list[dict]:
    """変更ファイルどうしの依存を返す。

    @param files 変更ファイル(`changed_files` の戻り値)
    @param head 中身を読む時点
    @returns `{"from": 使う側, "to": 使われる側}` の並び。消したファイル・バイナリ・Markdown・`MaxSourceCharacters` を
        超えるファイルは使う側にしない
    """
    paths = {file["path"] for file in files if file["status"] != "D"}
    edges = set()
    for file in files:
        source = file["path"]
        is_readable = file["status"] != "D" and file["additions"] is not None and not source.endswith(".md")
        if not is_readable:
            continue
        content = file_at(head, source)
        if len(content) > MaxSourceCharacters:
            continue
        text = code_of(source, content)
        imported = import_targets(source, text, paths) if source.endswith(ScriptSuffixes) else set()
        imported_python = python_import_targets(text, paths) if source.endswith(".py") else set()
        mentioned = mentioned_paths(source, text, paths)
        targets = (imported | imported_python | mentioned) & paths
        edges.update((source, target) for target in targets if target != source)
    return [{"from": source, "to": target} for source, target in sorted(edges)]


def commits_between(base: str, head: str) -> list[dict]:
    """base..head のコミットを古い順に、変更ファイルとともに返す。マージコミットは変更ファイルを持たない。"""
    shas = git("rev-list", "--reverse", f"{base}..{head}").split()
    return [
        {"sha": sha, "files": sorted(git("diff-tree", "--no-commit-id", "-r", "-z", "--name-only", "-M", sha).split("\0")[:-1])}
        for sha in shas
    ]


def build_map(base_tip: str, head_ref: str, pr: int) -> dict:
    """change-map.json の中身を作る。

    @param base_tip PR の base の先端
    @param head_ref PR の head
    @param pr PR 番号
    @returns 地図。`mergeBase` は base の先端ではなく head との分岐点。変更が無ければ各一覧は空配列
    """
    head = git("rev-parse", head_ref).strip()
    merge_base = git("merge-base", base_tip, head).strip()
    files = changed_files(merge_base, head)
    return {
        "version": 1,
        "pr": pr,
        "mergeBase": merge_base,
        "head": head,
        "groups": group_files(files),
        "tests": test_changes(files, merge_base, head),
        "commits": commits_between(merge_base, head),
        "dependencies": dependencies_between(files, head),
    }


def main(argv: list[str]) -> int:
    args = dict(zip(argv[1::2], argv[2::2]))
    complete = len(argv) == 7 and set(args) == {"--base", "--head", "--pr"} and args["--pr"].isdigit()
    if not complete:
        print("使い方: build-pr-change-map.py --base <sha> --head <sha> --pr <番号>", file=sys.stderr)
        return 2
    try:
        change_map = build_map(args["--base"], args["--head"], int(args["--pr"]))
    except subprocess.CalledProcessError as error:
        print(f"git が失敗しました: {' '.join(error.cmd)}\n{error.stderr}", file=sys.stderr)
        return 1
    json.dump(change_map, sys.stdout, ensure_ascii=False, indent=2)
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
