#!/usr/bin/env bash
#
# 解説ページの検査の判定表。テンプレートのマーカーの間を書き換えたページを
# `check-pr-explain-html.py` へ流し、deny / pass が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-pr-explain-html-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **誤検出の側(本文テキストの `onClick={...}`・`javascript:` という語)を pass で置くのが
# 要。** React の解説では必ず出てくる綴りで、生のテキストを正規表現で見る実装に戻すと落ちる。
# すり抜けの側は、行き先の接頭辞の詐称・プロトコル相対・実体参照で書いた `javascript:`。
#
# 表は `期待|ケース名|マーカーの間に入れる HTML` の 1 行 1 ケース。HTML の綴りが 3 つだけ特別で、
# `@frame` は枠(CSS)を 1 文字変えたページ、`@nomarker` は END マーカーを消したページ、
# `@twice` は BEGIN マーカーを 2 つ置いたページを作る。`@template` はテンプレートそのもの。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
checker="$scripts_dir/check-pr-explain-html.py"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$repo_root/.claude/hooks/lib/cases-report.sh"

# テンプレートのマーカーの間を差し替えたページを $work/page.html に書く。
# $1 マーカーの間に入れる HTML(または特別な綴り)
write_page() {
  python3 - "$template" "$work/page.html" "$1" <<'PY'
import sys
template, out, region = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(template, encoding="utf-8").read()
begin, end = "<!-- EXPLAIN:BEGIN -->", "<!-- EXPLAIN:END -->"
head, rest = text.split(begin)
_, tail = rest.split(end)
pages = {
    "@template": text,
    "@frame": text.replace("--bg: #fbfaf7;", "--bg: #fbfaf8;", 1),
    "@nomarker": text.replace(end, ""),
    "@twice": head + begin + begin + rest,
}
page = pages.get(region, head + begin + "\n" + region + "\n" + end + tail)
open(out, "w", encoding="utf-8").write(page)
PY
}

verdict() {
  local output status
  output="$(python3 "$checker" "$work/page.html")" && status=0 || status=$?
  decide "$output" "$status" '^\[pr-explain-(marker|frame|content|csp)\]'
}

while IFS='|' read -r expected label region; do
  [ -n "$label" ] || continue
  write_page "$region"
  report "$expected" "$(verdict)" "$label"
done <<'CASES'
pass|テンプレートそのもの(未記入)|@template
pass|見本どおりの部品で埋めた解説|<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12">解説時点 <code>0123456</code></p><h1>題</h1><section class="part"><h2 id="behavior"><span class="kicker">振る舞い</span>振る舞いの変化</h2><table class="behavior"><tr><th>操作</th><th>変更前</th><th>変更後</th><th>根拠</th></tr><tr><td>a</td><td>b</td><td>c</td><td><code class="ref">src/utils/Option.ts:3</code></td></tr></table></section><div class="decision" data-kind="逸脱"><h3>案</h3><dl><dt>採った案</dt><dd>x</dd></dl></div>
pass|SVG の図(クラスで色を付ける)|<figure class="diagram"><svg viewBox="0 0 100 40" role="img"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"><path d="M0,0 L10,5 L0,10 z" class="d-line"/></marker></defs><rect x="1" y="1" width="40" height="30" class="d-box"/><text x="5" y="20" class="d-text">A</text><line x1="41" y1="16" x2="90" y2="16" class="d-line" marker-end="url(#arrow)"/></svg><figcaption>図</figcaption></figure>
pass|本文テキストの onClick={...} と javascript: という語|<p>ボタンは <code>onClick={handleClick}</code> で受ける。<code>javascript:</code> の URL は使わない。</p>
pass|エスケープしたコード抜粋の &lt;script&gt;|<pre class="code"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
pass|このリポジトリの github.com・Pages・# へのリンク|<a href="https://github.com/DIO0550/design-composer/pull/12">PR</a><a href="https://dio0550.github.io/design-composer/pr-preview/pr-12/">SB</a><a href="#map">地図</a>
deny|枠(CSS)を 1 文字変えた|@frame
deny|END マーカーが無い|@nomarker
deny|BEGIN マーカーが 2 つある|@twice
deny|内側に script|<script>alert(1)</script>
deny|内側に大文字の SCRIPT|<SCRIPT>alert(1)</SCRIPT>
deny|内側に style 要素|<style>body{display:none}</style>
deny|内側に iframe|<iframe src="https://github.com/DIO0550/design-composer/"></iframe>
deny|SVG の中の foreignObject|<svg><foreignObject><p>x</p></foreignObject></svg>
deny|onclick 属性|<p onclick="alert(1)">x</p>
deny|javascript: の href|<a href="javascript:alert(1)">x</a>
deny|実体参照で書いた javascript: の href|<a href="&#106;avascript:alert(1)">x</a>
deny|外部ドメインへの href|<a href="https://example.com/">x</a>
deny|リポジトリ名を接頭辞で詐称した href|<a href="https://github.com/DIO0550/design-composer-evil/">x</a>
deny|プロトコル相対の src|<img src="//evil.example/x.png">
deny|style 属性|<p style="background:url(https://example.com/x.png)">x</p>
deny|srcset 属性|<img src="#x" srcset="https://example.com/x.png 2x">
CASES

# 枠の CSP が固定スクリプトのハッシュを許していること。どのページを渡しても先に見るので、
# テンプレートそのものが通る(上の 1 行目)ことと、スクリプトを 1 文字変えたテンプレートで
# 落ちることの 2 つで確かめる。
sed 's/const Repo = /const  Repo = /' "$template" > "$work/broken-template.html"
output="$(python3 "$checker" "$work/broken-template.html" --template "$work/broken-template.html")" && status=0 || status=$?
report deny "$(decide "$output" "$status" '^\[pr-explain-csp\]')" "固定スクリプトを変えて CSP のハッシュを直さなかったテンプレート"

exit "$cases_failed"
