#!/usr/bin/env python3
"""PR の解説ページ(`pr-explain` スキルが書く HTML)を、公開してよい形かどうか検査する。

解説はテンプレート(`.claude/skills/pr-explain/templates/index.html`)の
`<!-- EXPLAIN:BEGIN -->` 〜 `<!-- EXPLAIN:END -->` の間だけを書き換えて作る。報告する違反は 4 つ。

- `pr-explain-marker` — マーカーが無い・重複している・順序が逆
- `pr-explain-frame` — マーカーの外(CSS・固定スクリプト・CSP)がテンプレートと違う
- `pr-explain-content` — マーカーの内側に、スクリプトが動く・外から読み込む・入力を送る要素や属性がある
- `pr-explain-csp` — テンプレートの CSP が許しているハッシュと、固定スクリプトの中身が合わない

**防いでいるのは事故で、攻撃ではない。** 解説は差分のコードを抜粋するので、エスケープし忘れた
`<script>` や `onClick=` がそのまま動く。差分を書ける人はリポジトリへ書き込める人なので、
攻撃者の入力は想定しない。それでも、すり抜けたときはブラウザが枠の CSP で止める。

内側は `html.parser` で**属性として**解析する。本文テキストに出てくる `onClick={...}` や
`javascript:` という語は、エスケープされていればタグにも属性にもならないので通る。属性の値は
実体参照をデコードした後で見る(`&#106;avascript:` も `javascript:` として扱う)。

使い方:
    check-pr-explain-html.py <解説の HTML> [--template <テンプレート>]

違反があれば標準出力へ報告して終了コード 1、無ければ 0。引数の誤りは 2。
"""

import base64
import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

BeginMarker = "<!-- EXPLAIN:BEGIN -->"
EndMarker = "<!-- EXPLAIN:END -->"

DefaultTemplate = Path(__file__).resolve().parents[2] / ".claude/skills/pr-explain/templates/index.html"

# スクリプトが動く・外から読み込む・入力を送る要素。SVG の図は許すので、SVG の中で
# スクリプトや別文書を差し込める要素(`foreignObject`・アニメーションで属性を書き換える要素)も並べる。
ForbiddenTags = frozenset({
    "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
    "link", "meta", "base", "form", "input", "button", "textarea", "select",
    "template", "noscript", "portal",
    "foreignobject", "animate", "set", "animatemotion", "animatetransform",
})

# 値が何であれ持たせない属性。`style` は `url(...)` で外から読み込めるので、見た目はクラスで付ける。
ForbiddenAttributes = frozenset({"style", "srcset", "srcdoc", "formaction", "action", "background", "ping"})

# 値が URL として解釈される属性。行き先を下の接頭辞に限る。
UrlAttributes = frozenset({"href", "src", "xlink:href", "poster", "cite", "data"})

# 内側から張ってよいリンクの行き先。末尾の `/` までを接頭辞にしているのは、
# `design-composer-evil` のような名前の詐称を通さないため。
AllowedUrlPrefixes = (
    "#",
    "https://github.com/DIO0550/design-composer/",
    "https://dio0550.github.io/design-composer/",
)

InlineScript = re.compile(r"<script>(.*?)</script>", re.S)
CspScriptHash = re.compile(r"script-src 'sha256-([A-Za-z0-9+/=]+)'")


class ContentScanner(HTMLParser):
    """マーカーの内側を走査し、許していない要素・属性を集める。"""

    def __init__(self, line_offset: int):
        super().__init__(convert_charrefs=True)
        self.line_offset = line_offset
        self.violations: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.inspect(tag, attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.inspect(tag, attrs)

    def inspect(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        line = self.getpos()[0] + self.line_offset
        if tag in ForbiddenTags:
            self.violations.append(f"line {line}: <{tag}> は書けない")
        for name, value in attrs:
            problem = attribute_problem(name, value or "")
            if problem:
                self.violations.append(f"line {line}: <{tag}> の {problem}")


def attribute_problem(name: str, value: str) -> str | None:
    """1 つの属性が許されない理由を返す。

    @param name 属性名(`html.parser` が小文字にしたもの)
    @param value 実体参照をデコードした後の値
    @returns 許されないならその理由。許されるなら None
    """
    if name.startswith("on"):
        return f"イベント属性 {name} は書けない"
    if name in ForbiddenAttributes:
        return f"属性 {name} は書けない"
    if name not in UrlAttributes:
        return None
    if value.strip().startswith(AllowedUrlPrefixes):
        return None
    return f"{name} の行き先 {value!r} は許していない(# かこのリポジトリの github.com / Pages だけ)"


def split_markers(text: str) -> tuple[str, str, str] | None:
    """マーカーで前・内側・後ろの 3 つに分ける。

    @param text HTML 全体
    @returns (前, 内側, 後ろ)。マーカーがそれぞれ 1 つずつ、BEGIN が先に無ければ None
    """
    has_one_each = text.count(BeginMarker) == 1 and text.count(EndMarker) == 1
    if not has_one_each:
        return None
    head, rest = text.split(BeginMarker)
    if EndMarker not in rest:
        return None
    inside, tail = rest.split(EndMarker)
    return head, inside, tail


def csp_problem(template: str) -> str | None:
    """テンプレートの CSP が固定スクリプトのハッシュを許しているかを見る。

    @param template テンプレートの HTML
    @returns 合っていなければその理由。合っていれば None
    """
    scripts = InlineScript.findall(template)
    declared = CspScriptHash.findall(template)
    if len(scripts) != 1 or len(declared) != 1:
        return f"固定スクリプト {len(scripts)} 本・CSP のハッシュ {len(declared)} 個(どちらも 1 つのはず)"
    actual = base64.b64encode(hashlib.sha256(scripts[0].encode("utf-8")).digest()).decode("ascii")
    if declared[0] != actual:
        return f"CSP は sha256-{declared[0]} を許しているが、固定スクリプトは sha256-{actual}"
    return None


def collect_violations(page: str, template: str) -> list[str]:
    """解説ページの違反を集める。

    @param page 検査する HTML
    @param template テンプレートの HTML
    @returns 報告の行。違反が無ければ空
    """
    problem = csp_problem(template)
    if problem:
        return [f"[pr-explain-csp] {problem}"]
    page_parts = split_markers(page)
    template_parts = split_markers(template)
    if page_parts is None or template_parts is None:
        return [f"[pr-explain-marker] {BeginMarker} と {EndMarker} を 1 つずつ、この順に置く"]
    head, inside, tail = page_parts
    frame_matches = (head, tail) == (template_parts[0], template_parts[2])
    if not frame_matches:
        return ["[pr-explain-frame] マーカーの外がテンプレートと違う(書き換えてよいのはマーカーの間だけ)"]
    scanner = ContentScanner(line_offset=head.count("\n"))
    scanner.feed(inside)
    scanner.close()
    return [f"[pr-explain-content] {violation}" for violation in scanner.violations]


def main(argv: list[str]) -> int:
    args = argv[1:]
    template_path = DefaultTemplate
    if len(args) == 3 and args[1] == "--template":
        template_path = Path(args[2])
        args = args[:1]
    if len(args) != 1:
        print("使い方: check-pr-explain-html.py <解説の HTML> [--template <テンプレート>]", file=sys.stderr)
        return 2
    page = Path(args[0]).read_text(encoding="utf-8")
    template = template_path.read_text(encoding="utf-8")
    violations = collect_violations(page, template)
    for violation in violations:
        print(violation)
    if violations:
        return 1
    print("解説ページに違反はありません")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
