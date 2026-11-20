#!/usr/bin/env python3
"""Issue を作る呼び出しが、作業の種類を決めているかを見る。

`implementation-flow` フェーズ 1「種類の確定」の手順 4 は、Issue を作るときに種類を決めることを求める。
作った後でラベルを付ける形は忘れても何も止まらないので、作成の呼び出しそのものを見る。
種類を決めたとみなすのは、次の 3 つのどれかを満たすとき（両方・複数あってもよい）。

- `flow:*` ラベルがちょうど 1 つある（重複は 1 つと数え、`flow:` の後が空のものは数えない。値が表にあるかは見ない）
- 本文に提案の行がある（`PROPOSAL_TEMPLATE`）
- 本文に `implementation-flow` に通さない行がある（`OPT_OUT_TEMPLATE`）

**行の書式はこのファイルの 2 つの定数だけが持つ。** 文書は写さずにここを指す。

報告する違反は次のとおり（並びが報告の順）。

- `issue-flow-kind-missing` — ラベルも 2 つの行も無い
- `issue-flow-kind-multiple` — 重複を除いた `flow:*` ラベルが 2 つ以上ある（行は提案なので数えない）
- `issue-flow-kind-unreadable` — ラベルが無く、本文を確定できない
  （ファイルが無い・通常ファイルでない・1 MiB を超える、標準入力がヒアドキュメントでない、
  閉じない引用符、`--input` が JSON でない、本文が展開を含み行も見つからない）

種類の綴りは、この一覧と `KINDS` にだけ書く（両者の一致は `issue-flow-kind-cases.sh` が照合する）。

作成とみなす呼び出しは 3 つ。

- `mcp__github__issue_write` の `method` が `create`
- Bash の `gh issue create`（`gh issue -R <repo> create` を含む）
- Bash の `gh api` で、エンドポイントが `repos/<owner>/<repo>/issues` で終わる POST

他のリポジトリへの作成は通す（自リポジトリは `--origin-url` の末尾 2 要素。空ならどのリポジトリも自分とみなす）。

**Bash は bash と同じ規則で字句に分けてから読む。** 本文や他のコマンドの引数に書いた
`gh issue create` を作成と取り違えず、展開で消える行を通さないため。手順は `scan()` を参照。

使い方:
    issue-flow-kind-violations.py --origin-url <URL>   # 標準入力に PreToolUse の JSON

違反があれば報告の行と直し方を標準出力へ出して終了コード 1、無ければ何も出さずに 0。
"""

import json
import os
import re
import shlex
import sys
from typing import NamedTuple

KINDS = ("issue-flow-kind-missing", "issue-flow-kind-multiple", "issue-flow-kind-unreadable")
MISSING, MULTIPLE, UNREADABLE = KINDS

# 提案の行と、通さない行。`{kind}` は小文字の語、`{reason}` は空でない文に当たる。
PROPOSAL_TEMPLATE = "種類の提案: `flow:{kind}`（{reason}）"
OPT_OUT_TEMPLATE = "種類: implementation-flow に通さない（{reason}）"

# bash が展開する位置に置く印と、切り出した本文の置き場の印。どちらも私用領域の文字で、
# 入力にもともと含まれていれば読めないものとして扱う。
EXPANSION = ""
PLACEHOLDER = ""

# 読む本文ファイルの上限。超えるものは読まずに確定できないとする。
MAX_BODY_FILE_BYTES = 1024 * 1024

# `$` に続くと展開になる文字（`$(` `${` `$NAME` `$1` `$@` など）。`$'` と `$"` は含めない。
EXPANDING_DOLLAR_NEXT = re.compile(r"[({A-Za-z_0-9@*#?$!-]")

# ヒアドキュメントの区切りの語（クォートを含んでよい）。
DELIMITER_WORD = r"""(?:[^\s;&|()<>'"\\]|\\.|'[^']*'|"[^"]*")+"""
HEREDOC_OPERATOR = re.compile(r"<<(-?)[ \t]*(" + DELIMITER_WORD + ")")
# ダブルクォートの中の `$(cat <<[-]D` から改行まで。これだけは本文として読める。
CAT_HEREDOC = re.compile(r"\$\(\s*cat[ \t]+<<(-?)[ \t]*(" + DELIMITER_WORD + r")[ \t]*\n")
CAT_HEREDOC_CLOSE = re.compile(r"[ \t\n]*\)")
SLOT = re.compile(PLACEHOLDER + r"(\d+)" + PLACEHOLDER)

SEPARATOR_CHARS = frozenset(";&|()\n")
REDIRECT_CHARS = frozenset("<>")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
API_ISSUES_ENDPOINT = re.compile(r"(?:^|/)repos/([^/]+)/([^/]+)/issues/?$")
MENTIONS_GH = re.compile(r"(?:^|[\s;&|(])gh\s")
MCP_ISSUE_WRITE = "mcp__github__issue_write"
USAGE = "使い方: issue-flow-kind-violations.py --origin-url <URL>（標準入力に PreToolUse の JSON）"
FLOW_PREFIX = "flow:"


class Unreadable(NamedTuple):
    """本文や入力を確定できなかったこと。`reason` は報告に出す理由。"""

    reason: str


class Heredoc(NamedTuple):
    """ヒアドキュメントの開始。`slot` は本文表の番号。"""

    slot: int
    delimiter: str
    quoted: bool
    strip_tabs: bool


class Step(NamedTuple):
    """走査の 1 歩。`body` は置き場へ入れる本文、`heredoc` は改行の後で読む本文。"""

    next_index: int
    piece: str
    toggles_double: bool = False
    body: str | None = None
    heredoc: tuple[str, bool, bool] | None = None
    line_end: bool = False


class Scanned(NamedTuple):
    """印を付けた入力と、切り出した本文の表。"""

    text: str
    bodies: tuple[str, ...]


class Segment(NamedTuple):
    """区切り記号で分けた 1 つのコマンド。`stdin` はヒアドキュメントの本文（無ければ None）。"""

    words: tuple[str, ...]
    stdin: str | None
    written_to: tuple[str, ...]


class Context(NamedTuple):
    """判定に要る周りの事実。`self_repo` が None なら、どのリポジトリも自分とみなす。"""

    base_dir: str
    self_repo: str | None
    written: dict[str, str]


class Finding(NamedTuple):
    """1 件の違反。"""

    kind: str
    target: str
    detail: str


class FlagSpec(NamedTuple):
    """コマンドのフラグの読み方。`names` は綴り → 正規名、`valued` は値を取る正規名。"""

    names: dict[str, str]
    valued: frozenset[str]


ISSUE_CREATE_FLAGS = FlagSpec(
    names={
        "-a": "assignee", "--assignee": "assignee", "-b": "body", "--body": "body",
        "-F": "body-file", "--body-file": "body-file", "-e": "editor", "--editor": "editor",
        "-l": "label", "--label": "label", "-m": "milestone", "--milestone": "milestone",
        "-p": "project", "--project": "project", "--recover": "recover", "-T": "template",
        "--template": "template", "-t": "title", "--title": "title", "-w": "web", "--web": "web",
        "-R": "repo", "--repo": "repo",
    },
    valued=frozenset(
        {"assignee", "body", "body-file", "label", "milestone", "project", "recover", "template", "title", "repo"}
    ),
)

API_FLAGS = FlagSpec(
    names={
        "-X": "method", "--method": "method", "-f": "raw-field", "--raw-field": "raw-field",
        "-F": "field", "--field": "field", "--input": "input", "-H": "header", "--header": "header",
        "-q": "jq", "--jq": "jq", "-t": "template", "--template": "template", "--cache": "cache",
        "-p": "preview", "--preview": "preview", "--hostname": "hostname",
    },
    valued=frozenset({"method", "raw-field", "field", "input", "header", "jq", "template", "cache", "preview", "hostname"}),
)

API_BODY_FLAGS = frozenset({"raw-field", "field", "input"})


def line_pattern(template: str) -> re.Pattern[str]:
    """行の書式から、行頭から行末までに当てる正規表現を組む。

    @param template `{kind}` と `{reason}` を含みうる書式
    @returns 1 行に当てる正規表現（行末の空白は許す）
    """
    parts = re.split(r"(\{kind\}|\{reason\})", template)
    fills = {"{kind}": "[a-z]+", "{reason}": r"[^\n]*\S[^\n]*"}
    body = "".join(fills.get(part, re.escape(part)) for part in parts)
    return re.compile(r"^" + body + r"[ \t]*$", re.M)


KIND_LINES = (line_pattern(PROPOSAL_TEMPLATE), line_pattern(OPT_OUT_TEMPLATE))


def has_kind_line(body: str) -> bool:
    """本文に、展開の印を含まない提案の行か通さない行があるか。

    @param body 本文
    @returns 1 行でもあれば True
    """
    lines = (match.group(0) for pattern in KIND_LINES for match in pattern.finditer(body))
    return any(EXPANSION not in line for line in lines)


def is_expanding_dollar(text: str, index: int) -> bool:
    """`text[index]` の `$` が展開になるか。

    @param text 走査している文字列
    @param index `$` の位置
    @returns 展開になるなら True
    """
    return text[index] == "$" and EXPANDING_DOLLAR_NEXT.match(text, index + 1) is not None


def starts_range_expansion(text: str, index: int) -> bool:
    """`text[index]` から、範囲を持つ展開（`` `…` `` か `$(…)`）が始まるか。

    @param text 走査している文字列
    @param index 見る位置
    @returns 始まるなら True
    """
    return text[index] == "`" or text.startswith("$(", index)


def substitution_end(text: str, start: int) -> int | None:
    """`$(` の閉じ括弧の次の位置を返す。中のクォートは読み飛ばす。

    中のヒアドキュメントや `case` の `)` は考えずに数える（README「残る穴」）。

    @param text 走査している文字列
    @param start `$(` の `$` の位置
    @returns 閉じ括弧の次の位置。閉じなければ None
    """
    depth = 0
    quote = ""
    index = start + 1
    while index < len(text):
        char = text[index]
        if quote == "'":
            quote = "" if char == "'" else quote
        elif char == "\\":
            index += 1
        elif quote == '"':
            quote = "" if char == '"' else quote
        elif char in "'\"":
            quote = char
        else:
            depth += {"(": 1, ")": -1}.get(char, 0)
            if depth == 0:
                return index + 1
        index += 1
    return None


def backtick_end(text: str, start: int) -> int | None:
    """`` ` `` の閉じの次の位置を返す。

    @param text 走査している文字列
    @param start 開きの `` ` `` の位置
    @returns 閉じの次の位置。閉じなければ None
    """
    index = start + 1
    while index < len(text):
        if text[index] == "\\":
            index += 2
            continue
        if text[index] == "`":
            return index + 1
        index += 1
    return None


def range_expansion_end(text: str, start: int) -> int | Unreadable:
    """範囲を持つ展開の終わりを返す。

    @param text 走査している文字列
    @param start 展開の始まり
    @returns 終わりの次の位置。閉じなければ Unreadable
    """
    end = substitution_end(text, start) if text.startswith("$(", start) else backtick_end(text, start)
    return Unreadable("閉じない展開がある") if end is None else end


def expand_unquoted_heredoc(body: str) -> str | Unreadable:
    """区切りをクォートしないヒアドキュメントの本文を、bash が渡す形に寄せる。

    `\\$` `` \\` `` `\\\\` は 1 文字に戻し、バックスラッシュ改行はつなぐ。展開は範囲全体を印 1 つにする。

    @param body 切り出した本文
    @returns 寄せた本文。展開が閉じなければ Unreadable
    """
    pieces: list[str] = []
    index = 0
    while index < len(body):
        pair = body[index : index + 2]
        if pair in ("\\$", "\\`", "\\\\"):
            pieces.append(pair[1])
            index += 2
            continue
        if pair == "\\\n":
            index += 2
            continue
        if starts_range_expansion(body, index):
            end = range_expansion_end(body, index)
            if isinstance(end, Unreadable):
                return end
            pieces.append(EXPANSION)
            index = end
            continue
        pieces.append(EXPANSION if is_expanding_dollar(body, index) else body[index])
        index += 1
    return "".join(pieces)


def unquote_delimiter(word: str) -> tuple[str, bool]:
    """ヒアドキュメントの区切りの語から、区切りの行とクォートの有無を取る。

    @param word `<<` の後の語（`'EOF'` `"EOF"` `\\EOF` `E'OF'` など）
    @returns 区切りの行と、クォートを含むか
    """
    quoted = any(char in word for char in "'\"\\")
    return re.sub(r"""\\(.)|['"]""", lambda match: match.group(1) or "", word), quoted


def read_heredoc(text: str, start: int, spec: tuple[str, bool, bool]) -> tuple[str, int] | Unreadable:
    """`text[start]` から区切りの行までを本文として切り出す。

    @param text 入力全体
    @param start 本文の 1 行目の先頭
    @param spec 区切りの行・クォートの有無・行頭のタブを除くか
    @returns 本文（クォートなしなら `expand_unquoted_heredoc` 済み）と、区切りの行の次の位置。区切りの行が無ければ Unreadable
    """
    delimiter, quoted, strip_tabs = spec
    lines: list[str] = []
    index = start
    while index < len(text):
        end = text.find("\n", index)
        end = len(text) if end < 0 else end
        line = text[index:end].lstrip("\t") if strip_tabs else text[index:end]
        index = end + 1
        if line == delimiter:
            body = "".join(lines)
            expanded = body if quoted else expand_unquoted_heredoc(body)
            return (expanded, index) if isinstance(expanded, str) else expanded
        lines.append(line + "\n")
    return Unreadable("ヒアドキュメントの区切りの行が無い")


def starts_word(text: str, index: int) -> bool:
    """`text[index]` が語の頭か（`#` をコメントと読むかに使う）。

    @param text 走査している文字列
    @param index 見る位置
    @returns 語の頭なら True
    """
    return index == 0 or text[index - 1] in " \t\n;&|()<>"


def unquoted_step(text: str, index: int) -> Step | Unreadable:
    """クォートの外の 1 歩。

    @param text 入力全体
    @param index 今の位置
    @returns 1 歩。閉じないシングルクォートなら Unreadable
    """
    char = text[index]
    if char == "'":
        end = text.find("'", index + 1)
        return Unreadable("閉じない引用符がある") if end < 0 else Step(end + 1, text[index : end + 1])
    if char == '"':
        return Step(index + 1, char, toggles_double=True)
    if char == "\\":
        return Step(index + 2, text[index : index + 2])
    if text.startswith("<<<", index):
        return Step(index + 3, "<<<")
    heredoc = HEREDOC_OPERATOR.match(text, index)
    if heredoc:
        delimiter, quoted = unquote_delimiter(heredoc.group(2))
        return Step(heredoc.end(), "", heredoc=(delimiter, quoted, heredoc.group(1) == "-"))
    is_comment = char == "#" and starts_word(text, index)
    if is_comment:
        end = text.find("\n", index)
        return Step(len(text) if end < 0 else end, "")
    if char == "\n":
        return Step(index + 1, char, line_end=True)
    is_expansion = char == "`" or is_expanding_dollar(text, index)
    return Step(index + 1, EXPANSION if is_expansion else char)


def double_quoted_step(text: str, index: int) -> Step | Unreadable:
    """ダブルクォートの中の 1 歩。`$(cat <<D …)` は本文として、それ以外の展開は範囲全体を印 1 つにする。

    @param text 入力全体
    @param index 今の位置
    @returns 1 歩。閉じない展開・区切りの行の無いヒアドキュメントなら Unreadable
    """
    char = text[index]
    if char == '"':
        return Step(index + 1, char, toggles_double=True)
    if char == "\\":
        escaped = text[index + 1 : index + 2]
        return Step(index + 2, escaped if escaped in "`$" else text[index : index + 2])
    cat_heredoc = CAT_HEREDOC.match(text, index)
    if cat_heredoc:
        delimiter, quoted = unquote_delimiter(cat_heredoc.group(2))
        read = read_heredoc(text, cat_heredoc.end(), (delimiter, quoted, cat_heredoc.group(1) == "-"))
        if isinstance(read, Unreadable):
            return read
        close = CAT_HEREDOC_CLOSE.match(text, read[1])
        if close:
            return Step(close.end(), "", body=read[0].rstrip("\n"))
    if starts_range_expansion(text, index):
        end = range_expansion_end(text, index)
        return end if isinstance(end, Unreadable) else Step(end, EXPANSION)
    return Step(index + 1, EXPANSION if is_expanding_dollar(text, index) else char)


def slot_marker(slot: int) -> str:
    """本文表の番号を、置き場の印にする。

    @param slot 本文表の番号
    @returns 置き場の印
    """
    return f"{PLACEHOLDER}{slot}{PLACEHOLDER}"


def read_pending(text: str, start: int, pending: list[Heredoc], bodies: list[str]) -> int | Unreadable:
    """改行の後に続くヒアドキュメントの本文を、開始の順に切り出して本文表へ入れる。

    @param text 入力全体
    @param start 改行の次の位置
    @param pending 本文を待っているヒアドキュメント（開始の順）
    @param bodies 本文表（`pending` の `slot` へ書き込む）
    @returns 最後の区切りの行の次の位置。区切りの行が無ければ Unreadable
    """
    index = start
    for heredoc in pending:
        read = read_heredoc(text, index, (heredoc.delimiter, heredoc.quoted, heredoc.strip_tabs))
        if isinstance(read, Unreadable):
            return read
        bodies[heredoc.slot], index = read
    return index


def scan(command: str) -> Scanned | Unreadable:
    """コマンドに印を付け、ヒアドキュメントの本文を切り出す。

    1 回の走査でクォートの状態（外／ダブルクォートの中）を追い、シングルクォートは閉じるまで字面のまま写す。
    クォートの外とダブルクォートの中のバックスラッシュ改行はつなぎ、クォートの外の `<<` だけを
    ヒアドキュメントとして切り出して置き場の印にする。展開する位置は `EXPANSION` にする（クォートの外は
    1 文字だけを置き換えて中身を残し、`URL=$(gh issue create …)` の中の作成を読めるようにする）。

    @param command Bash のコマンド全体
    @returns 印を付けた入力と本文表。閉じない引用符・展開・ヒアドキュメントや、目印の文字を含む入力なら Unreadable
    """
    has_marker = EXPANSION in command or PLACEHOLDER in command
    if has_marker:
        return Unreadable("入力に目印の文字（U+E000 / U+E001）が含まれている")
    pieces: list[str] = []
    bodies: list[str] = []
    pending: list[Heredoc] = []
    index = 0
    in_double = False
    while index < len(command):
        if command.startswith("\\\n", index):
            index += 2
            continue
        step = double_quoted_step(command, index) if in_double else unquoted_step(command, index)
        if isinstance(step, Unreadable):
            return step
        index = step.next_index
        in_double = in_double != step.toggles_double
        if step.body is not None:
            pieces.append(slot_marker(len(bodies)))
            bodies.append(step.body)
            continue
        if step.heredoc is not None:
            pending.append(Heredoc(len(bodies), *step.heredoc))
            pieces.append("<< " + slot_marker(len(bodies)))
            bodies.append("")
            continue
        pieces.append(step.piece)
        if step.line_end and pending:
            read = read_pending(command, index, pending, bodies)
            if isinstance(read, Unreadable):
                return read
            index = read
            pending = []
    if in_double:
        return Unreadable("閉じない引用符がある")
    if pending:
        return Unreadable("ヒアドキュメントの区切りの行が無い")
    return Scanned("".join(pieces), tuple(bodies))


def split_tokens(marked: str) -> list[str] | Unreadable:
    """印を付けた入力を、bash と同じ区切りで字句に分ける。

    @param marked `scan()` が返した入力
    @returns 字句の並び。shlex が分けられなければ Unreadable
    """
    lexer = shlex.shlex(marked, posix=True, punctuation_chars="();<>|&\n")
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True
    lexer.commenters = ""
    try:
        return list(lexer)
    except ValueError as error:
        return Unreadable(f"字句に分けられない（{error}）")


def is_punctuation(token: str) -> bool:
    """字句が句読点だけでできているか。

    @param token 字句
    @returns 句読点だけなら True
    """
    return token != "" and all(char in SEPARATOR_CHARS or char in REDIRECT_CHARS for char in token)


def is_separator(token: str) -> bool:
    """字句がコマンドの区切り（`;` `&&` `|` `(` `)` 改行など）か。リダイレクトは区切りにしない。

    @param token 字句
    @returns 区切りなら True
    """
    return is_punctuation(token) and not any(char in REDIRECT_CHARS for char in token)


def is_redirect(token: str) -> bool:
    """字句がリダイレクトの演算子か。

    @param token 字句
    @returns リダイレクトなら True
    """
    return is_punctuation(token) and any(char in REDIRECT_CHARS for char in token)


def resolve(word: str, bodies: tuple[str, ...]) -> str:
    """語の中の置き場の印を、本文表の本文に戻す。

    @param word 字句
    @param bodies 本文表
    @returns 戻した語
    """
    return SLOT.sub(lambda match: bodies[int(match.group(1))], word)


def heredoc_slot(target: str) -> int | None:
    """リダイレクトの行き先が置き場の印そのものなら、その番号を返す。

    @param target `<<` の次の字句
    @returns 本文表の番号。印でなければ None
    """
    match = SLOT.fullmatch(target)
    return int(match.group(1)) if match else None


def build_segment(tokens: list[str], bodies: tuple[str, ...]) -> Segment:
    """区切りの間の字句を、語・標準入力・書き出し先に分ける。

    @param tokens 区切りを含まない字句の並び
    @param bodies 本文表
    @returns 1 つのコマンド
    """
    words: list[str] = []
    stdin: str | None = None
    written_to: list[str] = []
    index = 0
    while index < len(tokens):
        token = tokens[index]
        target = tokens[index + 1] if index + 1 < len(tokens) else ""
        if not is_redirect(token):
            words.append(resolve(token, bodies))
            index += 1
            continue
        slot = heredoc_slot(target)
        if token == "<<" and slot is not None:
            stdin = bodies[slot]
        if token in (">", ">>"):
            written_to.append(resolve(target, bodies))
        index += 2
    return Segment(tuple(words), stdin, tuple(written_to))


def split_segments(tokens: list[str], bodies: tuple[str, ...]) -> list[Segment]:
    """字句の並びを、区切り記号でコマンドごとに分ける。

    @param tokens 字句の並び
    @param bodies 本文表
    @returns コマンドの並び（空のものは除く）
    """
    groups: list[list[str]] = [[]]
    for token in tokens:
        if is_separator(token):
            groups.append([])
            continue
        groups[-1].append(token)
    return [build_segment(group, bodies) for group in groups if group]


def split_assignments(words: tuple[str, ...]) -> tuple[dict[str, str], tuple[str, ...]]:
    """先頭の `VAR=val` を、環境変数とコマンドの語に分ける。

    @param words コマンドの語
    @returns 環境変数と、残りの語
    """
    count = 0
    while count < len(words) and ASSIGNMENT.match(words[count]):
        count += 1
    env = dict(word.split("=", 1) for word in words[:count])
    return env, words[count:]


def parse_flags(args: tuple[str, ...], spec: FlagSpec) -> list[tuple[str, str]]:
    """フラグと値の組を、出てきた順に並べる。位置引数は名前を空にして並べる。

    `--name value` `--name=value` `-n value` `-nvalue` を読む。知らないフラグは値を取らないものとする。

    @param args コマンドの後ろの語
    @param spec フラグの読み方
    @returns （正規名, 値）の並び。値を取らないフラグの値は空
    """
    parsed: list[tuple[str, str]] = []
    index = 0
    while index < len(args):
        word = args[index]
        name, inline = split_flag(word, spec)
        index += 1
        if name == "":
            parsed.append(("", word))
            continue
        takes_next = name in spec.valued and inline is None
        if not takes_next:
            parsed.append((name, inline or ""))
            continue
        if index < len(args):
            parsed.append((name, args[index]))
        index += 1
    return parsed


def split_flag(word: str, spec: FlagSpec) -> tuple[str, str | None]:
    """1 語をフラグの正規名と、語に含まれる値に分ける。

    @param word 語
    @param spec フラグの読み方
    @returns 正規名と値。位置引数なら名前は空、値は None。値を語に含まないなら値は None
    """
    if word.startswith("--"):
        flag, _, value = word.partition("=")
        name = spec.names.get(flag, flag)
        return name, (value if "=" in word else None)
    short = word[:2]
    is_short_flag = word.startswith("-") and len(word) > 1
    if not is_short_flag:
        return "", None
    name = spec.names.get(short, short)
    has_inline_value = len(word) > 2 and name in spec.valued
    return name, (word[2:] if has_inline_value else None)


def repo_key(spec: str) -> str:
    """`[HOST/]OWNER/REPO` や URL の末尾 2 要素を、比べる形にする。

    @param spec リポジトリの綴り
    @returns 小文字の `owner/repo`（2 要素に満たなければ小文字の綴りそのもの）
    """
    trimmed = spec.strip().rstrip("/")
    trimmed = trimmed[:-4] if trimmed.endswith(".git") else trimmed
    parts = [part for part in re.split(r"[/:]", trimmed) if part]
    return "/".join(parts[-2:]).lower()


def origin_repo(url: str) -> str | None:
    """origin の URL から自リポジトリを決める。

    @param url `git remote get-url origin` の出力（https / `.git` 付き / ssh / パス付き）
    @returns 小文字の `owner/repo`。空なら None
    """
    return repo_key(url) if url.strip() else None


def targets_self(spec: str | None, context: Context) -> bool:
    """作成先が自リポジトリか。

    明示が無い、origin が空、綴りが展開を含む、のどれかなら自リポジトリとみなす。

    @param spec 明示された作成先（無ければ None）
    @param context 判定の周りの事実
    @returns 自リポジトリなら True
    """
    if spec is None or context.self_repo is None or EXPANSION in spec:
        return True
    return repo_key(spec) == context.self_repo


def read_body_file(path: str, context: Context) -> str | Unreadable:
    """本文のファイルを読む。同じコマンドの前の断片で書いたファイルなら、その本文を返す。

    @param path `--body-file` などに渡したパス（相対なら `context.base_dir` から辿る）
    @param context 判定の周りの事実
    @returns 本文。パスが展開を含む・ファイルが無い・通常ファイルでない・上限を超えるなら Unreadable
    """
    if EXPANSION in path:
        return Unreadable(f"本文のパスが展開を含む（{path}）")
    full = os.path.join(context.base_dir, path)
    if full in context.written:
        return context.written[full]
    if not os.path.isfile(full):
        return Unreadable(f"本文のファイルが無いか、通常ファイルでない（{full}）")
    if os.path.getsize(full) > MAX_BODY_FILE_BYTES:
        return Unreadable(f"本文のファイルが 1 MiB を超える（{full}）")
    try:
        with open(full, encoding="utf-8", errors="replace") as file:
            return file.read()
    except OSError as error:
        return Unreadable(f"本文のファイルを読めない（{full}: {error.strerror}）")


def stdin_body(segment: Segment, flag: str) -> str | Unreadable:
    """標準入力から読む本文を返す。ヒアドキュメントのときだけ読める。

    @param segment 作成のコマンド
    @param flag 報告に出すフラグの綴り
    @returns 本文。標準入力がヒアドキュメントでなければ Unreadable
    """
    if segment.stdin is None:
        return Unreadable(f"{flag} の標準入力がヒアドキュメントでない")
    return segment.stdin


def judge(labels: list[str], bodies: list[str | Unreadable]) -> tuple[str, str] | None:
    """ラベルと本文から、種類を決めているかを判定する。

    @param labels 作成に付けるラベル
    @param bodies 本文の候補（読めなかったものは Unreadable）
    @returns 違反なら（種別, 説明）。決めていれば None
    """
    flow_labels = sorted({label for label in labels if is_flow_label(label)})
    if len(flow_labels) >= 2:
        return MULTIPLE, f"flow:* ラベルが 2 つ以上ある（{', '.join(flow_labels)}）"
    if flow_labels:
        return None
    texts = [body for body in bodies if isinstance(body, str)]
    if any(has_kind_line(text) for text in texts):
        return None
    reasons = [body.reason for body in bodies if isinstance(body, Unreadable)]
    reasons += ["本文が展開を含み、展開の後の行を確定できない" for text in texts if EXPANSION in text]
    if reasons:
        return UNREADABLE, f"flow:* ラベルが無く、本文を確定できない（{reasons[0]}）"
    return MISSING, "flow:* ラベルも、種類の提案の行も、implementation-flow に通さない行も無い"


def is_flow_label(label: str) -> bool:
    """`flow:` の後が空でなく、展開の印を含まないラベルか。

    @param label ラベル
    @returns 数えるなら True
    """
    has_value = label.startswith(FLOW_PREFIX) and label.strip() != FLOW_PREFIX
    return has_value and EXPANSION not in label


def issue_create_finding(env: dict[str, str], args: tuple[str, ...], segment: Segment, context: Context) -> Finding | None:
    """`gh issue` の後ろの語が作成なら判定する。

    @param env 先頭の `VAR=val`
    @param args `gh issue` の後ろの語
    @param segment 作成のコマンド
    @param context 判定の周りの事実
    @returns 違反なら Finding。作成でない・他のリポジトリ・`--web`・種類を決めているなら None
    """
    flags = parse_flags(args, ISSUE_CREATE_FLAGS)
    positionals = [value for name, value in flags if name == ""]
    if positionals[:1] != ["create"]:
        return None
    values = {name: [value for flag, value in flags if flag == name] for name in ("repo", "label", "body", "body-file", "web")}
    repo = (values["repo"] or [env.get("GH_REPO")])[-1]
    if values["web"] or not targets_self(repo, context):
        return None
    labels = [label.strip() for value in values["label"] for label in value.split(",")]
    bodies: list[str | Unreadable] = list(values["body"])
    bodies += [stdin_body(segment, "--body-file -") if path == "-" else read_body_file(path, context) for path in values["body-file"]]
    verdict = judge(labels, bodies)
    return Finding(verdict[0], "gh issue create", verdict[1]) if verdict else None


def api_field_body(name: str, value: str, segment: Segment, context: Context) -> str | Unreadable:
    """`gh api` のフィールド `body=` の値を、送られる本文にする。

    `-F` / `--field` だけが `@path` をファイルの中身として読む。`-f` / `--raw-field` は字面のまま送る。

    @param name フラグの正規名（`field` か `raw-field`）
    @param value `body=` の後ろ
    @param segment 作成のコマンド
    @param context 判定の周りの事実
    @returns 本文。読めなければ Unreadable
    """
    reads_file = name == "field" and value.startswith("@")
    if not reads_file:
        return value
    if value == "@-":
        return stdin_body(segment, "-F body=@-")
    return read_body_file(value[1:], context)


def api_input(path: str, segment: Segment, context: Context) -> tuple[list[str], list[str | Unreadable]]:
    """`--input` の JSON から、ラベルと本文を取る。

    @param path `--input` の値（`-` は標準入力）
    @param segment 作成のコマンド
    @param context 判定の周りの事実
    @returns ラベルと本文の候補。読めない・JSON のオブジェクトでなければ本文の候補に Unreadable
    """
    raw = stdin_body(segment, "--input -") if path == "-" else read_body_file(path, context)
    if isinstance(raw, Unreadable):
        return [], [raw]
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return [], [Unreadable("--input が JSON でない")]
    if not isinstance(payload, dict):
        return [], [Unreadable("--input が JSON のオブジェクトでない")]
    labels = [label if isinstance(label, str) else str(label.get("name", "")) for label in payload.get("labels") or [] if isinstance(label, (str, dict))]
    body = payload.get("body")
    return labels, ([body] if isinstance(body, str) else [])


def api_finding(args: tuple[str, ...], segment: Segment, context: Context) -> Finding | None:
    """`gh api` の後ろの語が Issue の作成なら判定する。

    @param args `gh api` の後ろの語
    @param segment 作成のコマンド
    @param context 判定の周りの事実
    @returns 違反なら Finding。作成でない・他のリポジトリ・種類を決めているなら None
    """
    flags = parse_flags(args, API_FLAGS)
    endpoint = next((value for name, value in flags if name == ""), "")
    issues = API_ISSUES_ENDPOINT.search(endpoint.split("?", 1)[0])
    methods = [value.upper() for name, value in flags if name == "method"]
    sends_body = any(name in API_BODY_FLAGS for name, _ in flags)
    is_post = methods[-1] == "POST" if methods else sends_body
    if issues is None or not is_post:
        return None
    owner, repo = issues.groups()
    uses_placeholder = "{owner}" in owner or "{repo}" in repo
    if not uses_placeholder and not targets_self(f"{owner}/{repo}", context):
        return None
    labels: list[str] = []
    bodies: list[str | Unreadable] = []
    for name, value in flags:
        key, _, field_value = value.partition("=")
        is_field = name in ("field", "raw-field")
        if is_field and key == "labels[]":
            labels.append(field_value)
        if is_field and key == "body":
            bodies.append(api_field_body(name, field_value, segment, context))
        if name == "input":
            input_labels, input_bodies = api_input(value, segment, context)
            labels += input_labels
            bodies += input_bodies
    verdict = judge(labels, bodies)
    return Finding(verdict[0], f"gh api {endpoint}", verdict[1]) if verdict else None


def segment_finding(segment: Segment, context: Context) -> Finding | None:
    """1 つのコマンドが Issue の作成なら判定する。

    @param segment コマンド
    @param context 判定の周りの事実
    @returns 違反なら Finding。作成でなければ None
    """
    env, words = split_assignments(segment.words)
    if words[:1] != ("gh",):
        return None
    if words[1:2] == ("issue",):
        return issue_create_finding(env, words[2:], segment, context)
    if words[1:2] == ("api",):
        return api_finding(words[2:], segment, context)
    return None


def remember_written(segment: Segment, context: Context) -> Context:
    """`cat > P <<EOF` の形で書いたファイルを、本文として覚えた文脈を返す。

    @param segment コマンド
    @param context 判定の周りの事実
    @returns 書いたファイルを足した文脈（書いていなければそのまま）
    """
    writes_heredoc = segment.words[:1] == ("cat",) and segment.stdin is not None
    if not writes_heredoc:
        return context
    written = {**context.written, **{os.path.join(context.base_dir, path): segment.stdin for path in segment.written_to}}
    return context._replace(written=written)


def bash_findings(command: str, context: Context) -> list[Finding]:
    """Bash のコマンドに含まれる作成を、1 件ずつ判定する。

    @param command コマンド全体
    @param context 判定の周りの事実
    @returns 違反の並び
    """
    scanned = scan(command)
    tokens = split_tokens(scanned.text) if isinstance(scanned, Scanned) else scanned
    if isinstance(tokens, Unreadable):
        return unscannable_findings(command, tokens)
    findings: list[Finding] = []
    for segment in split_segments(tokens, scanned.bodies):
        finding = segment_finding(segment, context)
        findings += [finding] if finding else []
        context = remember_written(segment, context)
    return findings


def unscannable_findings(command: str, unreadable: Unreadable) -> list[Finding]:
    """字句に分けられなかったコマンドの報告。`gh` を含まないなら作成ではないとして通す。

    @param command コマンド全体
    @param unreadable 分けられなかった理由
    @returns 違反の並び
    """
    if not MENTIONS_GH.search(command):
        return []
    return [Finding(UNREADABLE, "Bash のコマンド", f"作成かどうかと本文を確定できない（{unreadable.reason}）")]


def mcp_findings(tool_input: dict, context: Context) -> list[Finding]:
    """`mcp__github__issue_write` の作成を判定する。

    @param tool_input ツールの入力
    @param context 判定の周りの事実
    @returns 違反の並び
    """
    if tool_input.get("method") != "create":
        return []
    repo = f"{tool_input.get('owner', '')}/{tool_input.get('repo', '')}"
    if not targets_self(repo, context):
        return []
    labels = [label for label in tool_input.get("labels") or [] if isinstance(label, str)]
    body = tool_input.get("body")
    verdict = judge(labels, [body] if isinstance(body, str) else [])
    return [Finding(verdict[0], MCP_ISSUE_WRITE, verdict[1])] if verdict else []


def guidance() -> str:
    """報告の後ろに付ける直し方。人に尋ねる道を、提案の行より先に出す。

    @returns 直し方の文
    """
    proposal = PROPOSAL_TEMPLATE.format(kind="<種類>", reason="<根拠>")
    opt_out = OPT_OUT_TEMPLATE.format(reason="<理由>")
    return f"""
Issue を作る呼び出しの中で、作業の種類を決めてください。

1. 対話中なら AskUserQuestion で人に尋ね、人が答えた flow:* を作成の呼び出しのラベルに含める（例: --label flow:feature）。親が自分で選んだラベルは付けない
2. 人がいない起動のときだけ、本文に次の行を行頭から書く
{proposal}
3. implementation-flow に通さない Issue（harness-growth の介入・棚卸し・tracking の親など）は、本文に次の行を行頭から書く
{opt_out}

手順: .claude/skills/implementation-flow/SKILL.md フェーズ 1「種類の確定」の手順 4・5
本文はシングルクォートか 'EOF' で渡す（ダブルクォートや、区切りをクォートしないヒアドキュメントでは ` と $ が展開されて行が消える）。相対パスで読めなければ絶対パスにする"""


def findings_for(hook_input: dict, context: Context) -> list[Finding]:
    """フックの入力から、違反を集める。

    @param hook_input PreToolUse の入力
    @param context 判定の周りの事実
    @returns 違反の並び
    """
    tool_input = hook_input.get("tool_input") or {}
    tool_name = hook_input.get("tool_name")
    if tool_name == MCP_ISSUE_WRITE:
        return mcp_findings(tool_input, context)
    command = tool_input.get("command")
    if tool_name == "Bash" and isinstance(command, str):
        return bash_findings(command, context)
    return []


def context_for(hook_input: dict, origin_url: str) -> Context:
    """フックの入力と origin の URL から、判定の周りの事実を組む。

    @param hook_input PreToolUse の入力
    @param origin_url `git remote get-url origin` の出力（空なら、どのリポジトリも自分とみなす）
    @returns 相対パスの起点を入力の `cwd`（無ければカレントディレクトリ）にした事実
    """
    cwd = hook_input.get("cwd")
    return Context(cwd if isinstance(cwd, str) and cwd else os.getcwd(), origin_repo(origin_url), {})


def main() -> int:
    """標準入力の PreToolUse の JSON を判定し、違反を報告する。

    @returns 違反が無ければ 0、あれば 1、引数が違うか入力が JSON でなければ 2
    """
    # argparse は使わない。全 Bash 呼び出しのうち `issue` を含むものに乗るので、import の 8ms を省く。
    arguments = sys.argv[1:]
    if len(arguments) != 2 or arguments[0] != "--origin-url":
        print(USAGE)
        return 2
    try:
        hook_input = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        print(USAGE)
        return 2
    if not isinstance(hook_input, dict):
        return 0
    findings = findings_for(hook_input, context_for(hook_input, arguments[1]))
    if not findings:
        return 0
    for finding in findings:
        print(f"[{finding.kind}] {finding.target}: {finding.detail}")
    print(guidance())
    return 1


if __name__ == "__main__":
    sys.exit(main())
