#!/usr/bin/env python3
"""解説ページの枠(`.claude/skills/pr-explain/templates/index.html`)の CSP と固定スクリプトを検査する。

ページは変更の地図(`change-map.json`)と解説(`explain.json`)を読み、固定スクリプトが
`createElement` と `textContent` で組む。JSON の中身は差分のコードや PR の本文をそのまま含むので、
**固定スクリプトが HTML として解釈させる API を 1 か所でも使えば、そこから中身が要素になる。**
それを語の有無で止め、すり抜けたものは CSP でブラウザが止める。報告する違反は 2 つ。

- `pr-explain-csp` — CSP が次のどれかを外れている
  - `script-src` は `'sha256-…'` 1 つだけで、固定スクリプトのハッシュと一致する(固定スクリプトは 1 本)
  - `connect-src` は `'self'` だけ(2 つの JSON を同じフォルダから読む)
  - `style-src` は `'unsafe-inline'` と `https://fonts.googleapis.com`、`font-src` は
    `https://fonts.gstatic.com` のうちから選ぶ(書かなければ `default-src` が止める)
- `pr-explain-template` — 固定スクリプトが `ForbiddenWords` の語を使っている。語として見るので、
  コメントの中の綴りも落とす

使い方:
    check-pr-explain-template.py <テンプレート>

違反が無ければ終了コード 0。違反があれば標準出力へ報告して 1。引数の誤りは 2。
"""

import base64
import hashlib
import re
import sys
from pathlib import Path

ScriptTag = re.compile(r"<script\b", re.I)
InlineScript = re.compile(r"<script>(.*?)</script>", re.S)
CspMeta = re.compile(r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"', re.I)
ScriptHash = re.compile(r"'sha256-([A-Za-z0-9+/]+={0,2})'")

# 文字列を HTML として解釈させる API。
ForbiddenWords = (
    "innerHTML",
    "outerHTML",
    "insertAdjacentHTML",
    "document.write",
    "document.writeln",
    "DOMParser",
    "createContextualFragment",
    "setHTMLUnsafe",
    "srcdoc",
)

# ディレクティブごとに許す出どころ。ここに無いディレクティブは見ない。
AllowedSources = {
    "connect-src": frozenset({"'self'"}),
    "style-src": frozenset({"'unsafe-inline'", "https://fonts.googleapis.com"}),
    "font-src": frozenset({"https://fonts.gstatic.com"}),
}

# 書かれていなければならないディレクティブ。`connect-src` が無いと、`default-src 'none'` で 2 つの JSON が読めない。
RequiredExactly = {"connect-src": frozenset({"'self'"})}


def word_pattern(word: str) -> re.Pattern:
    """語として見る正規表現(前後が識別子の文字でない)。`.` の前後の空白も同じ語とみなす。"""
    spelled = r"\s*\.\s*".join(re.escape(part) for part in word.split("."))
    return re.compile(rf"(?<![\w$]){spelled}(?![\w$])")


def directives_of(policy: str) -> dict[str, list[str]]:
    """CSP をディレクティブ名と出どころの並びに割る。"""
    parts = [part.split() for part in policy.split(";") if part.strip()]
    return {part[0].lower(): part[1:] for part in parts}


def script_problems(template: str, directives: dict[str, list[str]]) -> list[str]:
    """固定スクリプトが 1 本で、`script-src` がそのハッシュだけを許しているかを見る。"""
    scripts = InlineScript.findall(template)
    tags = len(ScriptTag.findall(template))
    is_single_script = tags == 1 and len(scripts) == 1
    if not is_single_script:
        return [f"固定スクリプトは属性の無い <script> 1 本だけにする(今は <script 始まりが {tags} 個)"]
    sources = directives.get("script-src", [])
    hashes = [ScriptHash.fullmatch(source) for source in sources]
    is_single_hash = len(sources) == 1 and hashes[0] is not None
    if not is_single_hash:
        return [f"script-src は 'sha256-…' 1 つだけにする(今は {' '.join(sources) or '無し'})"]
    actual = base64.b64encode(hashlib.sha256(scripts[0].encode("utf-8")).digest()).decode("ascii")
    if hashes[0].group(1) != actual:
        return [f"script-src は sha256-{hashes[0].group(1)} を許しているが、固定スクリプトは sha256-{actual}"]
    return []


def source_problems(directives: dict[str, list[str]]) -> list[str]:
    """`script-src` 以外のディレクティブが許す出どころを見る。"""
    missing = [f"{name} が無い({' '.join(sources)} だけを書く)" for name, sources in RequiredExactly.items() if name not in directives]
    extra = {name: set(directives.get(name, [])) - allowed for name, allowed in AllowedSources.items()}
    wrong = [
        f"{name} に許していない出どころ {' '.join(sorted(sources))}(許すのは {' / '.join(sorted(AllowedSources[name]))})"
        for name, sources in extra.items()
        if sources
    ]
    return missing + wrong


def csp_problems(template: str) -> list[str]:
    """CSP の違反を集める。"""
    policies = CspMeta.findall(template)
    if len(policies) != 1:
        return [f"CSP の <meta> は 1 つだけ置く(今は {len(policies)} 個)"]
    directives = directives_of(policies[0])
    return script_problems(template, directives) + source_problems(directives)


def word_problems(template: str) -> list[str]:
    """固定スクリプトが使っている、HTML として解釈させる API を集める。"""
    script = "".join(InlineScript.findall(template))
    return [f"固定スクリプトが {word} を使っている(textContent と createElement で組む)" for word in ForbiddenWords if word_pattern(word).search(script)]


def main(argv: list[str]) -> int:
    if len(argv) != 2 or not Path(argv[1]).is_file():
        print("使い方: check-pr-explain-template.py <テンプレート>", file=sys.stderr)
        return 2
    template = Path(argv[1]).read_text(encoding="utf-8")
    violations = [f"[pr-explain-csp] {problem}" for problem in csp_problems(template)]
    violations += [f"[pr-explain-template] {problem}" for problem in word_problems(template)]
    for violation in violations:
        print(violation)
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
