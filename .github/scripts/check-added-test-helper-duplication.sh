#!/usr/bin/env bash
#
# この PR で**追加された**テストヘルパーが、プロジェクト全体の `__tests__/` にある
# 別のヘルパーと本体が一字一句同じでないかを検出する。1 件でもあれば exit 1。
#
# `.claude/hooks/check-test-helper-duplication.sh` は編集時に同じ判定を見るが、
# Claude Code のフックは発火しない実行環境がある(`.claude/hooks/README.md`)ので、
# CI 側でも同じ判定を通す(`check-added-lint-suppressions.sh` と同じ形)。
#
# 判定そのものは `.claude/hooks/lib/duplicate-test-helpers.py --lines` で共有している
# (`<行番号>:<名前>` を返す。`lint-suppressions.py` と同じ出力形式)。
# 既存の重複で落とさないよう、**追加された行に載っているヘルパーだけ**を違反とする。
set -euo pipefail

# `cd` の前に解決する(`cd` したあとの `$0` は元の作業ディレクトリからの相対になる)
script_dir="$(cd "$(dirname "$0")" && pwd)"
base="${1:-${BASE_SHA:-origin/main}}"
cd "$(git rev-parse --show-toplevel)"

. "$script_dir/lib/detector-precondition.sh"
. "$script_dir/lib/added-lines.sh"
init_added_lines "$base"
detector=.claude/hooks/lib/duplicate-test-helpers.py
require_runnable_detector "追加されたテストヘルパーの重複" "$detector"


violations=""
while IFS= read -r file; do
  [ -f "$file" ] || continue
  case "$(basename "$(dirname "$file")")" in
    __tests__) ;;
    *) continue ;;
  esac

  added="$(added_line_numbers "$base" "$file")"
  [ -z "$added" ] && continue

  # `|| true` は外せない(理由は check-added-lint-suppressions.sh の同じ行)。
  reported="$(python3 "$detector" --lines "$file" || true)"
  [ -z "$reported" ] && continue

  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    violations="${violations}${file}:${entry}
"
  done < <(entries_on_added_lines "$added" "$reported")
done < <(git diff --name-only --diff-filter=d "$base"...HEAD -- '*.ts' '*.tsx')

if [ -z "$violations" ]; then
  echo "追加されたテストヘルパーの重複はありません"
  exit 0
fi

cat <<'MESSAGE'
本体が同じテストヘルパーが、__tests__ に 2 つ以上あります(このブランチで新しく追加された分)。
rules/testing.md「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で共通化する」
共通の setup へ寄せるか、汎用の操作なら実装側へ移してください。

検出された行:
MESSAGE
printf '%s' "$violations"
exit 1
