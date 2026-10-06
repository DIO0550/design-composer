#!/usr/bin/env python3
"""解説ページの「どこで何をしているか」に置くコード抜粋(断片の HTML)を、ファイルの行範囲から作る。

抜粋は PR の起点(merge-base)からの diff として書く。ページの固定スクリプトがそれを GitHub と
同じ差分の表示と、変更後のコードだけの表示に組み直し、読み手が切り替える。手で写さないのは、
行番号と中身が実物からずれるため。

範囲は**作業ツリーのファイルの行番号**で指定する(解説時点の head と同じ中身で走らせる)。範囲に
入るのは、変更後の行がその範囲にある行と、範囲の中(先頭の直前を含む)で消された行。起点に
無いファイルは全行が追加になる。

使い方:
    build-pr-explain-excerpt.py <パス> <開始行> <終了行> --base <起点の rev> [--lang <言語>]

標準出力へ `<p class="where-ref">` と `<pre class="code" data-diff>` を出す。`--lang` は拡張子と
中身の言語が違うとき(HTML の中のスクリプトなど)に付ける。範囲がファイルに収まらない・引数の
誤りは終了コード 2、git が失敗したら 1。
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
    """diff の 1 行。番号は変更前・変更後の行番号で、その側に無い行は None。"""

    sign: str
    text: str
    old_no: int | None
    new_no: int | None


def text_at(revision: str, path: str) -> str:
    """起点の時点のファイルの中身。起点に無いファイルは空(全行が追加になる)。"""
    shown = subprocess.run(["git", "show", f"{revision}:{path}"], capture_output=True, text=True)
    return shown.stdout if shown.returncode == 0 else ""


def whole_file_diff(before: str, path: str) -> list[str]:
    """起点の中身と作業ツリーのファイルの diff を、全行を文脈に入れた 1 つの hunk の行で返す。"""
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=Path(path).suffix) as old:
        old.write(before)
        old.flush()
        diffed = subprocess.run(["git", "diff", "--no-index", "--no-color", WholeFile, old.name, path], capture_output=True, text=True)
    if diffed.returncode not in (0, 1):
        raise subprocess.CalledProcessError(diffed.returncode, diffed.args, diffed.stdout, diffed.stderr)
    lines = diffed.stdout.splitlines()
    first_hunk = next((index for index, line in enumerate(lines) if HunkHeader.match(line)), None)
    if first_hunk is None:
        # 変更が無い。全行を文脈として扱う。
        return [f" {line}" for line in Path(path).read_text(encoding="utf-8").splitlines()]
    return [line for line in lines[first_hunk + 1:] if not line.startswith("\\")]


def numbered(diff: list[str]) -> list[DiffLine]:
    """diff の行に、変更前・変更後の行番号を振る(1 つの hunk が 1 行目から始まる前提)。"""
    numbered_lines = []
    old_no, new_no = 1, 1
    for line in diff:
        sign, text = line[:1] or " ", line[1:]
        numbered_lines.append(DiffLine(sign, text, None if sign == "+" else old_no, None if sign == "-" else new_no))
        old_no += 0 if sign == "+" else 1
        new_no += 0 if sign == "-" else 1
    return numbered_lines


def excerpt(lines: list[DiffLine], span: range) -> list[DiffLine]:
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
    """抜粋の `@@ -旧開始,旧行数 +新開始,新行数 @@`。変更前の行が無ければ旧の側は `0,0`。"""
    old_numbers = [line.old_no for line in lines if line.old_no is not None]
    new_count = sum(line.new_no is not None for line in lines)
    old_part = f"{old_numbers[0]},{len(old_numbers)}" if old_numbers else "0,0"
    return f"@@ -{old_part} +{span.start},{new_count} @@"


def render(path: str, span: range, lines: list[DiffLine], lang: str | None) -> str:
    """断片の HTML。中身はエスケープする。"""
    ref = f"{path}:{span.start}" if len(span) == 1 else f"{path}:{span.start}-{span.stop - 1}"
    body = "\n".join([hunk_header(lines, span), *(f"{line.sign}{line.text}" for line in lines)])
    lang_attribute = f' data-lang="{html.escape(lang)}"' if lang else ""
    return f'<p class="where-ref"><code class="ref">{html.escape(ref)}</code></p>\n<pre class="code" data-diff{lang_attribute}><code>{html.escape(body, quote=False)}</code></pre>'


def parse_args(argv: list[str]) -> dict[str, str] | None:
    """`<パス> <開始行> <終了行> --base <rev> [--lang <言語>]` を読む。読めなければ None。"""
    if len(argv) < 6:
        return None
    options = dict(zip(argv[4::2], argv[5::2]))
    is_complete = len(argv) % 2 == 0 and set(options) <= {"--base", "--lang"} and "--base" in options
    is_valid = is_complete and argv[2].isdigit() and argv[3].isdigit() and 1 <= int(argv[2]) <= int(argv[3])
    return {**options, "path": argv[1], "start": argv[2], "end": argv[3]} if is_valid else None


def main(argv: list[str]) -> int:
    options = parse_args(argv)
    if options is None:
        print("使い方: build-pr-explain-excerpt.py <パス> <開始行> <終了行> --base <起点の rev> [--lang <言語>]", file=sys.stderr)
        return 2
    path = options["path"]
    span = range(int(options["start"]), int(options["end"]) + 1)
    line_count = len(Path(path).read_text(encoding="utf-8").splitlines()) if Path(path).is_file() else 0
    if span.stop - 1 > line_count:
        print(f"{path} は {line_count} 行で、{span.start}-{span.stop - 1} 行目は収まらない", file=sys.stderr)
        return 2
    try:
        lines = numbered(whole_file_diff(text_at(options["--base"], path), path))
    except subprocess.CalledProcessError as error:
        print(f"git が失敗しました: {' '.join(error.cmd)}\n{error.stderr}", file=sys.stderr)
        return 1
    print(render(path, span, excerpt(lines, span), options.get("--lang")))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
