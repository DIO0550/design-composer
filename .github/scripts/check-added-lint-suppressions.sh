#!/usr/bin/env bash
#
# この PR で**追加された** lint 抑制コメント(biome-ignore / eslint-disable)を検出する。
# 1 件でもあれば exit 1。
#
# .claude/hooks/block-lint-suppress.sh は編集時にこれを止めるが、
# Claude Code のフックは発火しない実行環境がある(.claude/hooks/README.md)。
# 抑制コメントは diff に痕跡が残るので、CI 側でも同じ判定を通す。
#
# 判定そのものは .claude/hooks/lib/lint-suppressions.py で共有している。
# 既存行の抑制で落とさないよう、**追加された行に載っているものだけ**を違反とする。
set -euo pipefail

base="${1:-${BASE_SHA:-origin/main}}"
cd "$(git rev-parse --show-toplevel)"

# 追加・変更された行の行番号を、統一 diff のハンク見出しから取り出す
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
  case "$file" in
    .claude/*|node_modules/*|dist/*|src-tauri/target/*) continue ;;
  esac
  [ -f "$file" ] || continue
  # ファイル単位のエスケープハッチ(block-lint-suppress.sh と同じ)
  grep -qm1 '@lint-suppress-ok' "$file" 2>/dev/null && continue

  added="$(added_line_numbers "$file")"
  [ -z "$added" ] && continue

  reported="$(python3 .claude/hooks/lib/lint-suppressions.py "$file" || true)"
  [ -z "$reported" ] && continue

  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    echo "$added" | grep -qx "${entry%%:*}" || continue
    violations="${violations}${file}:${entry}
"
  done <<< "$reported"
done < <(git diff --name-only --diff-filter=d "$base"...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx')

if [ -z "$violations" ]; then
  echo "追加された lint 抑制コメントはありません"
  exit 0
fi

cat <<'MESSAGE'
lint 抑制コメントの追加は禁止されています。
lint エラーは抑制ではなく、コードを修正して解決してください。

許可されている例外:
  - useExhaustiveDependencies / react-hooks/exhaustive-deps（useEffect マウント時）
  - noUnusedVariables / no-unused-vars（ブランド型 declare const ... unique symbol の直前行のみ）
上記以外で本当に必要な場合は、対象ファイルに // @lint-suppress-ok を追加してください。

検出された行:
MESSAGE
printf '%s' "$violations"
exit 1
