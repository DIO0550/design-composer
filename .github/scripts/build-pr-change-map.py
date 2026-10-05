#!/usr/bin/env python3
"""PR の差分から、解説ページの「変更の地図」(`change-map.json`)を作る。

地図に載せるのは 3 つ。どれも git の差分だけで決まるので、AI ではなく Actions が作る。

- 変更したファイルを層ごとにまとめ、内側の層から外側へ読む順に並べたもの
- `__tests__/` のテスト名の増減(テスト名は仕様の文なので、増減がそのまま守る仕様の増減になる)
- コミットごとの変更ファイル(解説を書いた時点より後に何が変わったかをページ側で出すため)

**差分の起点は base の先端ではなく merge-base。** PR の画面の「Files changed」と同じ範囲にする。

**テスト名の増減は差分の行ではなく、前後のファイルの中身から抜いて集合で比べる。** 行で見ると、
ファイルの rename・中身だけの変更・`test.each(...)(` の改行の位置で、同じテストが
「削除 + 追加」に化ける。

使い方:
    build-pr-change-map.py --base <sha> --head <sha> --pr <番号>

標準出力へ JSON を出す。git が失敗したら終了コード 1、引数の誤りは 2。
"""

import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".claude/hooks/lib"))
from ts_sources import DEFAULT_ROOT, feature_of  # noqa: E402

DomainsRoot = f"{DEFAULT_ROOT}/domains"

# 層の読む順。内側(依存される側)から外側へ。`src/domains` のカテゴリは import してよい向き
# (`rules/architecture.md`「domains のカテゴリ」)の順に並べる。
DomainCategories = ("unit", "dcmp", "compiled", "session")
SourceLayers = (
    ("services", "src/services"),
    ("libs", "src/libs"),
    ("utils", "src/utils"),
    ("types", "src/types"),
)
OuterLayers = (
    ("components", "src/components"),
    ("hooks", "src/hooks"),
    ("app", "src/app"),
)
HarnessPaths = ("AGENTS.md", "CLAUDE.md", "rules/", ".claude/", ".github/", "harness/")

TestFolder = "/__tests__/"
TestFile = re.compile(r"/__tests__/.*\.test\.tsx?$")
StoryFile = re.compile(r"\.stories\.tsx?$")

# `test(` / `it(` と、その修飾(`.skip` `.only` など)と `.each`。`regex.test(` や `split(` を
# 拾わないよう、直前が識別子の文字や `.` でないことを求める。
TestCall = re.compile(r"(?<![\w$.])(?:test|it)(?:\.(?:skip|only|todo|concurrent|fails|sequential))*(\.each)?\s*\(")
Quote = re.compile(r"\s*(['\"`])")
OpeningParen = re.compile(r"\s*\(")
StatusLetters = {"A": "A", "M": "M", "D": "D", "R": "R", "C": "A", "T": "M"}


def git(*args: str) -> str:
    """git を走らせて標準出力を返す。失敗したら例外のまま落とす(地図を半端に作らない)。"""
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout


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
        file["additions"], file["deletions"] = line_counts.get(file["path"], (0, 0))
    return files


def numstat_by_path(fields: list[str]) -> dict[str, tuple[int, int]]:
    """`--numstat -z` の出力を、新しいパスごとの追加・削除行数にする。バイナリは 0 行として扱う。

    rename の行は `追加\\t削除\\t` の後に旧パスと新パスが別のフィールドで続く。
    """
    counts: dict[str, tuple[int, int]] = {}
    index = 0
    while index < len(fields) - 1:
        added, deleted, path = fields[index].split("\t", 2)
        step = 1
        if path == "":
            path = fields[index + 2]
            step = 3
        counts[path] = (int(added) if added.isdigit() else 0, int(deleted) if deleted.isdigit() else 0)
        index += step
    return counts


def layer_of(path: str) -> tuple[int, str, str]:
    """ファイルが属する層を、読む順の位置・層の見出し・層の中での並べ替えの鍵で返す。"""
    if path.startswith(f"{DomainsRoot}/"):
        category = path.split("/")[2]
        rank = DomainCategories.index(category) if category in DomainCategories else len(DomainCategories)
        return rank, f"domains / {category}", ""
    rank = len(DomainCategories) + 1
    for name, root in SourceLayers:
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
    return outer_layer_of(path, rank)


def outer_layer_of(path: str, rank: int) -> tuple[int, str, str]:
    """`src/` の層に入らないファイルの層を返す。"""
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


def commits_between(base: str, head: str) -> list[dict]:
    """base..head のコミットを古い順に、変更ファイルとともに返す。マージコミットは変更ファイルを持たない。"""
    shas = git("rev-list", "--reverse", f"{base}..{head}").split()
    return [
        {"sha": sha, "files": sorted(git("diff-tree", "--no-commit-id", "-r", "-z", "--name-only", "-M", sha).split("\0")[:-1])}
        for sha in shas
    ]


def build_map(base_ref: str, head_ref: str, pr: int) -> dict:
    """change-map.json の中身を作る。

    @param base_ref PR の base の先端
    @param head_ref PR の head
    @param pr PR 番号
    @returns 地図。変更が無ければ各一覧は空配列
    """
    head = git("rev-parse", head_ref).strip()
    base = git("merge-base", base_ref, head).strip()
    files = changed_files(base, head)
    return {
        "version": 1,
        "pr": pr,
        "base": base,
        "head": head,
        "groups": group_files(files),
        "tests": test_changes(files, base, head),
        "commits": commits_between(base, head),
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
