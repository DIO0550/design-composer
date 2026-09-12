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

base="${1:-${BASE_SHA:-origin/main}}"
cd "$(git rev-parse --show-toplevel)"

# 追加・変更された行の行番号を、統一 diff のハンク見出しから取り出す
# (check-added-lint-suppressions.sh と同じ)
added_line_numbers() {
  git diff -U0 "$base"...HEAD -- "$1" | awk '
    /^@@/ {
      match($0, /\+[0-9]+(,[0-9]+)?/)
      spec = substr($0, RSTART + 1, RLENGTH - 1)
      split(spec, parts, ",")
      count = (2 in parts) ? parts[2] : 1
      for (i = 0; i < count; i++) print parts[1] + i
    }
  '
}

violations=""
while IFS= read -r file; do
  [ -f "$file" ] || continue
  case "$(basename "$(dirname "$file")")" in
    __tests__) ;;
    *) continue ;;
  esac

  added="$(added_line_numbers "$file")"
  [ -z "$added" ] && continue

  reported="$(python3 .claude/hooks/lib/duplicate-test-helpers.py --lines "$file" || true)"
  [ -z "$reported" ] && continue

  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    echo "$added" | grep -qx "${entry%%:*}" || continue
    violations="${violations}${file}:${entry}
"
  done <<< "$reported"
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
