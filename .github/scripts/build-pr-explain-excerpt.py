#!/usr/bin/env python3
"""解説ページの「どこで何をしているか」に置くコード抜粋(断片の HTML)を、ファイルの行範囲から作る。

抜粋は PR の起点(merge-base)からの diff として書く。ページの固定スクリプトがそれを GitHub と
同じ差分の表示と、変更後のコードだけの表示に組み直し、読み手が切り替える。手で写さないのは、
行番号と中身が実物からずれるため。

変更後の側は**コミット済みの HEAD** から読み、範囲は HEAD のファイルの行番号で指定する(解説の
`explain-meta` の sha と同じ中身になる。作業ツリーだけにある編集・ignore したファイル・リポジトリの
外のファイルは載らない)。範囲に入るのは、変更後の行がその範囲にある行と、範囲の中(先頭の直前を
含む)で消された行。起点に無いファイルは全行が追加になる。

使い方(リポジトリのルートで):
    build-pr-explain-excerpt.py <パス> <開始行> <終了行> --base <起点の rev> [--lang <言語>]

標準出力へ `<p class="where-ref">` と `<pre class="code" data-diff>` を出す。`--lang` は拡張子と
中身の言語が違うとき(HTML の中のスクリプトなど)に付ける。起点がコミットを指さない・HEAD にその
ファイルが無い・範囲がファイルに収まらない・ルート以外で走らせた・引数の誤りは終了コード 2、
git が失敗したら 1。
"""

import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NamedTuple

HunkHeader = re.compile(r"@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@")
# 全行を 1 つの hunk に収める文脈の行数(どんなファイルより長い)。
WholeFile = "-U100000000"


class DiffLine(NamedTuple):
    """diff の 1 行。番号は変更前・変更後の行番号で、その側に無い行は None。

    `old_before` はこの行より前にある変更前の行の数(足した行だけの抜粋の見出しに使う)。
    """

    sign: str
    text: str
    old_no: int | None
    new_no: int | None
    old_before: int


class Excerpt(NamedTuple):
    """抜粋の指定。範囲は HEAD のファイルの行番号で、`lang` は `data-lang` に入れる言語(無ければ None)。"""

    path: str
    span: range
    lang: str | None


def commit_of(revision: str) -> str | None:
    """rev が指すコミットの sha を返す。

    @param revision `--base` に渡された rev
    @returns コミットの sha。空・`-` で始まる(git のオプションとして読まれうる)・コミットを指さないなら None
    """
    if revision == "" or revision.startswith("-"):
        return None
    resolved = subprocess.run(["git", "rev-parse", "--verify", "--quiet", f"{revision}^{{commit}}"], capture_output=True, text=True)
    return resolved.stdout.strip() if resolved.returncode == 0 else None


def exists_at(commit: str, path: str) -> bool:
    """そのコミットにファイルがあるかを返す。

    @param commit コミット(rev)
    @param path リポジトリのルートからのパス
    """
    return subprocess.run(["git", "cat-file", "-e", f"{commit}:{path}"], capture_output=True).returncode == 0


def text_at(commit: str, path: str) -> str:
    """そのコミットのファイルの中身を返す。git が失敗したら例外のまま落とす(空として扱わない)。

    @param commit コミット(rev)
    @param path リポジトリのルートからのパス
    @throws subprocess.CalledProcessError git が失敗したとき
    """
    return subprocess.run(["git", "show", f"{commit}:{path}"], check=True, capture_output=True, text=True).stdout


def lines_of(text: str) -> list[str]:
    """改行(`\\n`)だけで行に割る。git と同じ割り方にして行番号をずらさない(`splitlines` は U+2028 などでも割る)。"""
    lines = text.split("\n")
    return lines[:-1] if lines[-1] == "" else lines


def whole_file_diff(before: str, after: str) -> list[str]:
    """2 つの中身の diff を、全行を文脈に入れた 1 つの hunk の行で返す。

    @param before 起点の中身(起点に無いファイルは空)
    @param after HEAD の中身
    @returns `+` / `-` / ` ` で始まる行。変更が無ければ全行が文脈
    @throws subprocess.CalledProcessError git が失敗したとき
    """
    with tempfile.TemporaryDirectory() as folder:
        old, new = Path(folder) / "old", Path(folder) / "new"
        old.write_text(before, encoding="utf-8")
        new.write_text(after, encoding="utf-8")
        diffed = subprocess.run(["git", "diff", "--no-index", "--no-color", "--no-ext-diff", "--no-textconv", WholeFile, str(old), str(new)], capture_output=True, text=True)
    if diffed.returncode not in (0, 1):
        raise subprocess.CalledProcessError(diffed.returncode, diffed.args, diffed.stdout, diffed.stderr)
    lines = lines_of(diffed.stdout) if diffed.stdout else []
    first_hunk = next((index for index, line in enumerate(lines) if HunkHeader.match(line)), None)
    if first_hunk is None:
        return [f" {line}" for line in lines_of(after)] if after else []
    # `\ No newline at end of file` は行ではないので落とす。
    return [line for line in lines[first_hunk + 1:] if not line.startswith("\\")]


def numbered(diff: list[str]) -> list[DiffLine]:
    """diff の行に、変更前・変更後の行番号を振る(1 つの hunk が 1 行目から始まる前提)。"""
    numbered_lines = []
    old_no, new_no = 1, 1
    for line in diff:
        sign, text = line[:1] or " ", line[1:]
        numbered_lines.append(DiffLine(sign, text, None if sign == "+" else old_no, None if sign == "-" else new_no, old_no - 1))
        old_no += 0 if sign == "+" else 1
        new_no += 0 if sign == "-" else 1
    return numbered_lines


def excerpt_lines(lines: list[DiffLine], span: range) -> list[DiffLine]:
    """範囲に入る行だけを返す。

    消した行は、その次に来る変更後の行が範囲にあるときだけ入れる(範囲の先頭の直前で消した行は入り、
    末尾の直後で消した行は入らない)。後ろから辿って「次に来る変更後の行番号」を持ち回す。
    """
    new_numbers = [line.new_no for line in lines if line.new_no is not None]
    following = (new_numbers[-1] if new_numbers else 0) + 1
    picked = []
    for line in reversed(lines):
        following = line.new_no if line.new_no is not None else following
        if following in span:
            picked.append(line)
    return picked[::-1]


def hunk_header(lines: list[DiffLine], span: range) -> str:
    """抜粋の `@@ -旧開始,旧行数 +新開始,新行数 @@`。

    変更前の行が無い(足した行だけの)抜粋は、GitHub と同じく旧の側を「直前の変更前の行,0」にする。
    """
    old_numbers = [line.old_no for line in lines if line.old_no is not None]
    new_count = sum(line.new_no is not None for line in lines)
    old_part = f"{old_numbers[0]},{len(old_numbers)}" if old_numbers else f"{lines[0].old_before},0"
    return f"@@ -{old_part} +{span.start},{new_count} @@"


def render(request: Excerpt, lines: list[DiffLine]) -> str:
    """断片の HTML を返す。中身はエスケープする。

    @param request 抜粋の指定
    @param lines 範囲に入る diff の行(空でない)
    """
    span = request.span
    ref = f"{request.path}:{span.start}" if len(span) == 1 else f"{request.path}:{span.start}-{span.stop - 1}"
    body = "\n".join([hunk_header(lines, span), *(f"{line.sign}{line.text}" for line in lines)])
    lang_attribute = f' data-lang="{html.escape(request.lang)}"' if request.lang else ""
    return f'<p class="where-ref"><code class="ref">{html.escape(ref)}</code></p>\n<pre class="code" data-diff{lang_attribute}><code>{html.escape(body, quote=False)}</code></pre>'


def parse_args(argv: list[str]) -> tuple[Excerpt, str] | None:
    """`<パス> <開始行> <終了行> --base <rev> [--lang <言語>]` を読む。

    @returns 抜粋の指定と `--base` の値。読めなければ None
    """
    if len(argv) < 6:
        return None
    options = dict(zip(argv[4::2], argv[5::2]))
    is_complete = len(argv) % 2 == 0 and set(options) <= {"--base", "--lang"} and "--base" in options
    is_valid = is_complete and argv[2].isdigit() and argv[3].isdigit() and 1 <= int(argv[2]) <= int(argv[3])
    if not is_valid:
        return None
    return Excerpt(argv[1], range(int(argv[2]), int(argv[3]) + 1), options.get("--lang")), options["--base"]


def problem_of(request: Excerpt, base: str | None) -> str | None:
    """git を読む前に分かる誤りを返す。無ければ None。

    @param request 抜粋の指定
    @param base `--base` が指すコミット(指さなければ None)
    """
    prefix = subprocess.run(["git", "rev-parse", "--show-prefix"], capture_output=True, text=True).stdout.strip()
    if prefix:
        return f"リポジトリのルートで走らせる(いまは {prefix} の中。パスはルートからで書く)"
    if base is None:
        return "--base がコミットを指していない"
    if not exists_at("HEAD", request.path):
        return f"{request.path} は HEAD に無い(コミットしてから作る)"
    return None


def main(argv: list[str]) -> int:
    parsed = parse_args(argv)
    if parsed is None:
        print("使い方: build-pr-explain-excerpt.py <パス> <開始行> <終了行> --base <起点の rev> [--lang <言語>]", file=sys.stderr)
        return 2
    request, base_rev = parsed
    base = commit_of(base_rev)
    problem = problem_of(request, base)
    if problem:
        print(problem, file=sys.stderr)
        return 2
    try:
        after = text_at("HEAD", request.path)
        before = text_at(base, request.path) if exists_at(base, request.path) else ""
        lines = numbered(whole_file_diff(before, after))
    except subprocess.CalledProcessError as error:
        print(f"git が失敗しました: {' '.join(error.cmd)}\n{error.stderr}", file=sys.stderr)
        return 1
    line_count = sum(line.new_no is not None for line in lines)
    if request.span.stop - 1 > line_count:
        print(f"{request.path} は {line_count} 行で、{request.span.start}-{request.span.stop - 1} 行目は収まらない", file=sys.stderr)
        return 2
    print(render(request, excerpt_lines(lines, request.span)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
