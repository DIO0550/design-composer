#!/usr/bin/env bash
#
# 解説ページの枠の検査の判定表。リポジトリのテンプレートを 1 か所ずつ崩して
# `check-pr-explain-template.py` へ流し、落ちる分類が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-pr-explain-template-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **HTML として解釈させる語のケースは、固定スクリプトのハッシュを計算し直して CSP へ埋める。**
# 埋めないと、語を足したことでハッシュが合わなくなり、語の検査を消しても CSP の側で落ちて
# ok のまま残る。落ちるケースは、報告の行がすべて期待した分類であることまで見る。
#
# script-src に足す出どころは、正しいハッシュの**後ろ**に置く(先頭の出どころだけを見る実装を通さないため)。
#
# 表は `期待|分類|ケース名|変形` の 1 行 1 ケース。変形はテンプレート(変数 `t`)を書き換える
# Python の文で、`script` に入れた文字列は固定スクリプトの中身と差し替えてハッシュを埋め直す。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
checker="$scripts_dir/check-pr-explain-template.py"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
work="$(mktemp -d)" || exit 1
trap 'rm -rf "$work"' EXIT

source "$repo_root/.claude/hooks/lib/cases-report.sh"

# テンプレートに変形を当てて `$work/template.html` に置く。
# $1 変形(Python の文。`t` がテンプレート、`body` が固定スクリプトの中身。`script` に入れると差し替える)
make_template() {
  python3 - "$template" "$work/template.html" "$1" <<'PY'
import base64, hashlib, re, sys
t = open(sys.argv[1], encoding="utf-8").read()
body = re.search(r"<script>(.*?)</script>", t, re.S).group(1)
script = None
exec(sys.argv[3])
if script is not None:
    digest = lambda text: base64.b64encode(hashlib.sha256(text.encode("utf-8")).digest()).decode("ascii")
    t = t.replace(f"<script>{body}</script>", f"<script>{script}</script>", 1).replace(f"'sha256-{digest(body)}'", f"'sha256-{digest(script)}'", 1)
open(sys.argv[2], "w", encoding="utf-8").write(t)
PY
}

# 報告が 1 行以上あり、すべてが期待した分類の見出しで始まるか。
# $1 報告, $2 分類
all_in_category() {
  [ -n "$1" ] || return 1
  ! printf '%s\n' "$1" | grep -v "^\[pr-explain-$2\] " >/dev/null
}

# $1 期待する分類。pass / deny のほか、食い違いの形を返す。
verdict() {
  local category="$1" output status
  output="$(python3 "$checker" "$work/template.html" 2>&1)"; status=$?
  case "$status" in
    0) echo pass ;;
    1)
      # 報告の行がすべて期待した分類なら deny。別の分類が混ざれば、崩したのと別の規則で落ちている。
      if all_in_category "$output" "$category"; then
        echo deny
      else
        echo other-category
      fi
      ;;
    *) echo "exit-$status" ;;
  esac
}

while IFS='|' read -r expected category label change; do
  [ -n "$label" ] || continue
  make_template "$change"
  report "$expected" "$(verdict "$category")" "$label"
done <<'CASES'
pass|-|リポジトリのテンプレートは通る|
deny|csp|固定スクリプトを 1 文字変えてハッシュを直さない|t = t.replace("<script>", "<script> ", 1)
deny|csp|固定スクリプトが 2 本|t = t.replace("</body>", "<script></script></body>", 1)
deny|csp|script-src にハッシュが 2 つ|t = re.sub(r"(script-src '[^']*')", r"\1 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='", t, count=1)
deny|csp|script-src に外部ホスト|t = re.sub(r"(script-src '[^']*')", r"\1 https://example.com", t, count=1)
deny|csp|script-src に 'unsafe-inline'|t = re.sub(r"(script-src '[^']*')", r"\1 'unsafe-inline'", t, count=1)
deny|csp|connect-src に 'self' 以外|t = t.replace("connect-src 'self'", "connect-src 'self' https://example.com", 1)
deny|csp|style-src に計画に無いホスト|t = re.sub(r"style-src [^;]*", "style-src 'unsafe-inline' https://example.com", t, count=1)
deny|csp|font-src に計画に無いホスト|t = t.replace("connect-src ", "font-src https://fonts.gstatic.com https://example.com; connect-src ", 1) if "font-src" not in t else re.sub(r"font-src [^;]*", "font-src https://fonts.gstatic.com https://example.com", t, count=1)
deny|template|固定スクリプトに innerHTML|script = body + "\nnode.innerHTML;\n"
deny|template|固定スクリプトに outerHTML|script = body + "\nnode.outerHTML;\n"
deny|template|固定スクリプトに insertAdjacentHTML|script = body + "\nnode.insertAdjacentHTML;\n"
deny|template|固定スクリプトに document.write|script = body + "\ndocument.write;\n"
deny|template|固定スクリプトに document.writeln|script = body + "\ndocument.writeln;\n"
deny|template|固定スクリプトに DOMParser|script = body + "\nDOMParser;\n"
deny|template|固定スクリプトに createContextualFragment|script = body + "\nrange.createContextualFragment;\n"
deny|template|固定スクリプトに setHTMLUnsafe|script = body + "\nnode.setHTMLUnsafe;\n"
deny|template|コメントに書いた srcdoc|script = body + "\n// srcdoc\n"
CASES

exit "$cases_failed"
