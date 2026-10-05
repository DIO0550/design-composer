#!/usr/bin/env bash
#
# 解説ページの組み立ての判定表。断片を `build-pr-explain-page.py` へ流し、deny / pass が期待どおりかと、
# 組み立てたページの形を 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/build-pr-explain-page-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **誤検出の側(本文テキストの `onClick={...}`・`javascript:` という語)を pass で置くのが
# 要。** React の解説では必ず出てくる綴りで、生のテキストを正規表現で見る実装に戻すと落ちる。
# すり抜けの側は、行き先の接頭辞の詐称・プロトコル相対・実体参照で書いた `javascript:`、
# `html.parser` とブラウザとで解釈が割れるコメントと CDATA。
#
# 表は `期待|ケース名|断片` の 1 行 1 ケース。断片の先頭には、`@nometa` で始まらない限り
# 正しい `explain-meta`(PR #12・入口のページ・40 桁の sha)を付け、入口のページとして組み立てる。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
builder="$scripts_dir/build-pr-explain-page.py"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$repo_root/.claude/hooks/lib/cases-report.sh"

meta='<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12" data-page="index">解説時点</p>'

# $1 断片(先頭が `@nometa` なら explain-meta を付けない)、$2 テンプレート
verdict() {
  local fragment="$1" output status
  case "$fragment" in
    @nometa*) printf '%s\n' "${fragment#@nometa}" > "$work/fragment.html" ;;
    *) printf '%s\n%s\n' "$meta" "$fragment" > "$work/fragment.html" ;;
  esac
  rm -f "$work/page.html"
  output="$(python3 "$builder" "$work/fragment.html" --pr 12 --page index --out "$work/page.html" --template "$2")" && status=0 || status=$?
  decide "$output" "$status" '^\[pr-explain-(content|meta|csp)\]'
}

while IFS='|' read -r expected label fragment; do
  [ -n "$label" ] || continue
  report "$expected" "$(verdict "$fragment" "$template")" "$label"
done <<'CASES'
pass|見本どおりの部品で埋めた解説|<h1>題</h1><table class="behavior"><tr><th>操作</th><th>変更前</th><th>変更後</th><th>根拠</th></tr><tr><td>a</td><td>b</td><td>c</td><td><code class="ref">src/utils/Option.ts:3</code></td></tr></table><div class="decision" data-kind="逸脱"><h3>案</h3><dl><dt>採った案</dt><dd>x</dd></dl></div>
pass|SVG の図(クラスで色を付ける)|<figure class="diagram"><svg viewBox="0 0 100 40" role="img"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"><path d="M0,0 L10,5 L0,10 z" class="d-line"/></marker></defs><rect x="1" y="1" width="40" height="30" class="d-box"/><text x="5" y="20" class="d-text">A</text><line x1="41" y1="16" x2="90" y2="16" class="d-line" marker-end="url(#arrow)"/></svg><figcaption>図</figcaption></figure>
pass|本文テキストの onClick={...} と javascript: という語|<p>ボタンは <code>onClick={handleClick}</code> で受ける。<code>javascript:</code> の URL は使わない。</p>
pass|エスケープしたコード抜粋の &lt;script&gt;|<pre class="code"><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>
pass|実体参照で書いた # へのリンク(値はデコードしてから見る)|<a href="&#35;map">地図</a>
pass|解説のほかのページへのリンク|<a href="tests.html#t-1">テスト</a><a href="behavior.html">振る舞い</a>
deny|解説のページでない相対リンク|<a href="other.html">x</a>
deny|解説のページ名に続けた別の綴り|<a href="tests.html.evil">x</a>
pass|このリポジトリの github.com・Pages・# へのリンク|<a href="https://github.com/DIO0550/design-composer/pull/12">PR</a><a href="https://dio0550.github.io/design-composer/pr-preview/pr-12/">SB</a><a href="#overview">概要</a>
deny|explain-meta が無い|@nometa<h1>題</h1>
deny|explain-meta が 2 つある|<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12" data-page="index"></p>
deny|解説時点の sha が 41 桁|@nometa<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef012345678" data-pr="12" data-page="index"></p>
deny|解説時点の sha が 7 桁|@nometa<p class="explain-meta" data-explained-sha="0123456" data-pr="12" data-page="index"></p>
deny|data-pr が公開先の PR と違う|@nometa<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="13" data-page="index"></p>
deny|data-page が公開先のページと違う|@nometa<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12" data-page="tech"></p>
deny|内側に script|<script>alert(1)</script>
deny|内側に大文字の SCRIPT|<SCRIPT>alert(1)</SCRIPT>
deny|内側に style 要素|<style>body{display:none}</style>
deny|内側に iframe|<iframe src="https://github.com/DIO0550/design-composer/"></iframe>
deny|SVG の中の foreignObject|<svg><foreignObject><p>x</p></foreignObject></svg>
deny|onclick 属性|<p onclick="alert(1)">x</p>
deny|自己終了タグの onerror|<img src="#x" onerror="alert(1)"/>
deny|SVG の xlink:href に javascript:|<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>
deny|SVG のアニメーションで href を書き換える|<svg><a href="#x"><animate attributeName="href" to="javascript:alert(1)"/></a></svg>
deny|meta refresh での遷移(CSP では止まらない)|<meta http-equiv="refresh" content="0;url=https://example.com">
deny|javascript: の href|<a href="javascript:alert(1)">x</a>
deny|実体参照で書いた javascript: の href(デコードしても許す接頭辞に一致しない)|<a href="&#106;avascript:alert(1)">x</a>
deny|外部ドメインへの href|<a href="https://example.com/">x</a>
deny|リポジトリ名を接頭辞で詐称した href|<a href="https://github.com/DIO0550/design-composer-evil/">x</a>
deny|Pages のパスを接頭辞で詐称した href|<a href="https://dio0550.github.io/design-composer-evil/">x</a>
deny|プロトコル相対の src|<img src="//evil.example/x.png">
deny|style 属性|<p style="background:url(https://example.com/x.png)">x</p>
deny|srcset 属性|<img src="#x" srcset="https://example.com/x.png 2x">
deny|空のコメントの後ろに置いた要素(ブラウザでは要素になる)|<!--><img src=x onerror=alert(1)>-->
deny|CDATA の中に置いた要素(ブラウザでは最初の > で閉じる)|<![CDATA[><img src=x onerror=alert(1)>]]>
deny|ただのコメント|<!-- メモ -->
CASES

# 通った断片はテンプレートのマーカーの間に入り、マーカーの外はテンプレートのまま残る。
printf '%s\n<h1>差し込んだ解説</h1>\n' "$meta" > "$work/fragment.html"
python3 "$builder" "$work/fragment.html" --pr 12 --page index --out "$work/page.html" >/dev/null
assembled="$(python3 - "$template" "$work/page.html" <<'PY'
import sys
template, page = (open(path, encoding="utf-8").read() for path in sys.argv[1:3])
begin, end = "<!-- EXPLAIN:BEGIN -->", "<!-- EXPLAIN:END -->"
outside = lambda text: (text.split(begin)[0], text.split(end)[1])
inside = page.split(begin)[1].split(end)[0]
keeps_frame = outside(page) == outside(template)
holds = keeps_frame and "差し込んだ解説" in inside and "解説はまだ書かれていません" not in inside
print("pass" if holds else "deny")
PY
)"
report pass "$assembled" "組み立てたページはマーカーの外がテンプレートのままで、間が断片に置き換わる"

# 違反があればページを書き出さない。
printf '%s\n<script>x</script>\n' "$meta" > "$work/fragment.html"
rm -f "$work/page.html"
python3 "$builder" "$work/fragment.html" --pr 12 --page index --out "$work/page.html" >/dev/null
written=pass
[ -e "$work/page.html" ] && written=deny
report pass "$written" "違反のある断片からはページを書き出さない"

# 知らないページ名は引数の誤り(2)で、ページを書き出さない。
printf '%s\n' "${meta/data-page=\"index\"/data-page=\"other\"}" > "$work/fragment.html"
rm -f "$work/page.html"
python3 "$builder" "$work/fragment.html" --pr 12 --page other --out "$work/page.html" 2>/dev/null; status=$?
unknown_page=pass
{ [ "$status" -eq 2 ] && [ ! -e "$work/page.html" ]; } || unknown_page=deny
report pass "$unknown_page" "知らないページ名は引数の誤りとして断る"

# data-page の突き合わせは入口以外のページでも効き、属性が無いのを公開先のページ名とみなさない。
# 表は入口のページとして組み立てるので、入口以外のページへ置く形をここに置く。
# $1 断片の explain-meta の data-page 属性(空なら付けない)、$2 公開先のページ
page_verdict() {
  local attribute="${1:+ data-page=\"$1\"}" output status
  printf '<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12"%s>x</p>\n' "$attribute" > "$work/fragment.html"
  output="$(python3 "$builder" "$work/fragment.html" --pr 12 --page "$2" --out "$work/page.html")" && status=0 || status=$?
  decide "$output" "$status" '^\[pr-explain-meta\]'
}
report pass "$(page_verdict tech tech)" "技術のページへ data-page=tech の断片を置ける"
report deny "$(page_verdict index tech)" "技術のページへ data-page=index のままの断片を置こうとした"
report deny "$(page_verdict "" tech)" "data-page の無い断片は、公開先のページ名とみなさない"

# --page は必須で、無ければ引数の誤り(2)。入口とみなして組み立てない。
printf '%s\n' "$meta" > "$work/fragment.html"
rm -f "$work/page.html"
python3 "$builder" "$work/fragment.html" --pr 12 --out "$work/page.html" 2>/dev/null; status=$?
missing_page=pass
{ [ "$status" -eq 2 ] && [ ! -e "$work/page.html" ]; } || missing_page=deny
report pass "$missing_page" "--page が無ければ引数の誤りとして断る"

# 枠の CSP が固定スクリプトのハッシュを許していること。スクリプトを 1 文字変えて
# ハッシュを直さなかったテンプレートでは、断片が正しくても落ちる。
sed 's/const Repo = /const  Repo = /' "$template" > "$work/broken-template.html"
report deny "$(verdict "<h1>題</h1>" "$work/broken-template.html")" "固定スクリプトを変えて CSP のハッシュを直さなかったテンプレート"

exit "$cases_failed"
