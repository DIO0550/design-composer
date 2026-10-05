#!/usr/bin/env python3
"""PR の解説の断片(`pr-explain` スキルが書く HTML)を検査し、テンプレートへ差し込んで解説ページを組み立てる。

解説は読む目的ごとに 4 ページ(入口 `index` / 振る舞い `behavior` / 技術 `tech` / テスト `tests`)に分かれ、
どのページも同じテンプレートから組み立てる。セッションが書くのは、テンプレート(`.claude/skills/pr-explain/templates/index.html`)の
`<!-- EXPLAIN:BEGIN -->` 〜 `<!-- EXPLAIN:END -->` の間に入る断片だけ。枠(CSS・固定スクリプト・CSP)は
このスクリプトがテンプレートから写すので、断片の側からは変えられない。報告する違反は 3 つ。

- `pr-explain-content` — 断片に、スクリプトが動く・外から読み込む・入力を送る要素や属性、
  またはコメント・宣言がある
- `pr-explain-meta` — 断片の `explain-meta` が 1 つでない・解説時点の sha が 40 桁でない・PR 番号や
  ページ名が公開先と違う
- `pr-explain-csp` — テンプレートの CSP が許しているハッシュと、固定スクリプトの中身が合わない

**防いでいるのは事故で、攻撃ではない。** 解説は差分のコードを抜粋するので、エスケープし忘れた
`<script>` や `onClick=` がそのまま動く。差分を書ける人はリポジトリへ書き込める人なので、
攻撃者の入力は想定しない。それでも、すり抜けたときはブラウザが枠の CSP で止める。

断片は `html.parser` で**属性として**解析する。本文テキストに出てくる `onClick={...}` や
`javascript:` という語は、エスケープされていればタグにも属性にもならないので通る。属性の値は
実体参照をデコードした後で見る(`&#106;avascript:` も `javascript:` として扱う)。コメントと
宣言(`<!--` `<![CDATA[` `<!` `<?`)は断片に書かせない。`<!-->` のような綴りの解釈が
`html.parser` とブラウザとで割れ、その中に置いた要素が検査を素通りするため。

使い方:
    build-pr-explain-page.py <断片> --pr <番号> --page <ページ名> --out <書き出す先> [--template <テンプレート>]

違反が無ければページを書き出して終了コード 0。違反があれば標準出力へ報告して 1(書き出さない)。
引数の誤りは 2。
"""

import base64
import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import NamedTuple

BeginMarker = "<!-- EXPLAIN:BEGIN -->"
EndMarker = "<!-- EXPLAIN:END -->"

DefaultTemplate = Path(__file__).resolve().parents[2] / ".claude/skills/pr-explain/templates/index.html"

# 解説のページ名。gh-pages には `<ページ名>.html` で置く。
PageNames = ("index", "behavior", "tech", "tests")

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

# 断片から張ってよいリンクの行き先。末尾の `/` までを接頭辞にしているのは、
# `design-composer-evil` のような名前の詐称を通さないため。
AllowedUrlPrefixes = (
    "#",
    "https://github.com/DIO0550/design-composer/",
    "https://dio0550.github.io/design-composer/",
)

# 解説のページどうしのリンク(`tests.html#…`)。相対の行き先はこの 4 つのファイル名だけを許す。
SiblingPageLink = re.compile(rf"(?:{'|'.join(PageNames)})\.html(?:#[\w-]*)?")

FullSha = re.compile(r"[0-9a-f]{40}")
InlineScript = re.compile(r"<script>(.*?)</script>", re.S)
CspScriptHash = re.compile(r"script-src 'sha256-([A-Za-z0-9+/=]+)'")


class Destination(NamedTuple):
    """公開先(どの PR のどのページか)。"""

    pr: int
    page: str


class FragmentScanner(HTMLParser):
    """断片を走査し、許していない要素・属性・コメントと、`explain-meta` の属性を集める。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.violations: list[str] = []
        self.metas: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.inspect(tag, attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.inspect(tag, attrs)

    def handle_comment(self, data: str) -> None:
        self.reject("コメントは書けない")

    def handle_decl(self, decl: str) -> None:
        self.reject("宣言は書けない")

    def unknown_decl(self, data: str) -> None:
        self.reject("宣言(CDATA など)は書けない")

    def handle_pi(self, data: str) -> None:
        self.reject("処理命令は書けない")

    def reject(self, reason: str) -> None:
        self.violations.append(f"line {self.getpos()[0]}: {reason}")

    def inspect(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ForbiddenTags:
            self.reject(f"<{tag}> は書けない")
        values = {name: value or "" for name, value in attrs}
        if "explain-meta" in values.get("class", "").split():
            self.metas.append(values)
        for name, value in values.items():
            problem = attribute_problem(name, value)
            if problem:
                self.reject(f"<{tag}> の {problem}")


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
    target = value.strip()
    is_allowed = target.startswith(AllowedUrlPrefixes) or SiblingPageLink.fullmatch(target) is not None
    if is_allowed:
        return None
    return f"{name} の行き先 {value!r} は許していない(許すのは {' / '.join(AllowedUrlPrefixes)} で始まるものと、解説のページ {' / '.join(f'{page}.html' for page in PageNames)} だけ)"


def meta_problems(metas: list[dict[str, str]], destination: Destination) -> list[str]:
    """`explain-meta` が 1 つだけあり、解説時点の sha・PR 番号・ページ名を持っているかを見る。

    固定スクリプトはこの sha で根拠のリンク先・「古い」帯・「解説に出てこない」を決め、ページ名で
    地図から足す節を選ぶので、欠けると黙って出なくなる。

    @param metas 断片に現れた `explain-meta` 要素の属性
    @param destination 公開先
    @returns 違反の説明。無ければ空
    """
    if len(metas) != 1:
        return [f'class="explain-meta" の要素は 1 つだけ置く(今は {len(metas)} 個)']
    sha = metas[0].get("data-explained-sha", "")
    problems = []
    if not FullSha.fullmatch(sha):
        problems.append(f"data-explained-sha は 40 桁の sha で書く(今は {sha!r})")
    if metas[0].get("data-pr") != str(destination.pr):
        problems.append(f"data-pr が公開先の PR #{destination.pr} と違う(今は {metas[0].get('data-pr')!r})")
    if metas[0].get("data-page") != destination.page:
        problems.append(f"data-page が公開先のページ {destination.page} と違う(今は {metas[0].get('data-page')!r})")
    return problems


def csp_problem(template: str) -> str | None:
    """テンプレートの CSP が固定スクリプトのハッシュを許しているかを見る。

    @param template テンプレートの HTML
    @returns 合っていなければその理由。合っていれば None
    """
    scripts = InlineScript.findall(template)
    declared = CspScriptHash.findall(template)
    has_one_each = len(scripts) == 1 and len(declared) == 1
    if not has_one_each:
        return f"固定スクリプト {len(scripts)} 本・CSP のハッシュ {len(declared)} 個(どちらも 1 つのはず)"
    actual = base64.b64encode(hashlib.sha256(scripts[0].encode("utf-8")).digest()).decode("ascii")
    if declared[0] != actual:
        return f"CSP は sha256-{declared[0]} を許しているが、固定スクリプトは sha256-{actual}"
    return None


def collect_violations(fragment: str, template: str, destination: Destination) -> list[str]:
    """断片とテンプレートの違反を集める。

    @param fragment セッションが書いた断片
    @param template テンプレートの HTML
    @param destination 公開先
    @returns 報告の行。違反が無ければ空
    """
    problem = csp_problem(template)
    if problem:
        return [f"[pr-explain-csp] {problem}"]
    scanner = FragmentScanner()
    scanner.feed(fragment)
    scanner.close()
    content = [f"[pr-explain-content] {violation}" for violation in scanner.violations]
    meta = [f"[pr-explain-meta] {violation}" for violation in meta_problems(scanner.metas, destination)]
    return content + meta


def assemble(fragment: str, template: str) -> str:
    """断片をテンプレートのマーカーの間へ差し込む(マーカーの間にあった既定の文は捨てる)。"""
    before, rest = template.split(BeginMarker)
    _, after = rest.split(EndMarker)
    return f"{before}{BeginMarker}\n{fragment.strip()}\n{EndMarker}{after}"


def parse_args(argv: list[str]) -> dict[str, str] | None:
    """`<断片> --pr <番号> --page <ページ名> --out <先> [--template <テンプレート>]` を読む。読めなければ None。"""
    if len(argv) < 2:
        return None
    options = dict(zip(argv[2::2], argv[3::2]))
    options["fragment"] = argv[1]
    known = {"--pr", "--page", "--out", "--template", "fragment"}
    is_complete = len(argv) % 2 == 0 and set(options) <= known and {"--pr", "--page", "--out"} <= set(options)
    if not is_complete:
        return None
    is_valid = options["--pr"].isdigit() and options["--page"] in PageNames
    return options if is_valid else None


def main(argv: list[str]) -> int:
    options = parse_args(argv)
    if options is None:
        print(f"使い方: build-pr-explain-page.py <断片> --pr <番号> --page <{'|'.join(PageNames)}> --out <書き出す先> [--template <テンプレート>]", file=sys.stderr)
        return 2
    fragment = Path(options["fragment"]).read_text(encoding="utf-8")
    template = Path(options.get("--template", DefaultTemplate)).read_text(encoding="utf-8")
    destination = Destination(pr=int(options["--pr"]), page=options["--page"])
    violations = collect_violations(fragment, template, destination)
    for violation in violations:
        print(violation)
    if violations:
        return 1
    Path(options["--out"]).write_text(assemble(fragment, template), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
