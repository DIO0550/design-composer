#!/usr/bin/env bash
#
# `count.sh` の判定表。合成した記録と合成した常時ロードを置いた一時ツリーへ `count.sh` を
# 当て、窓の数え方と `--ratchet` の終了コードが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash harness/records/count-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、窓の取り方(綴りごとに持ち、そのうちいちばん古い窓から数える)が
# この集計の中心で、増え続ける本物の記録を目で数えても退行を検知できないため。** 同じ形の
# 前例は `.github/scripts/check-pr-closing-issue-cases.sh`。終了コードで見る理由も、そこと
# `.claude/hooks/lib/result-option-read-cases.sh` の冒頭にある。
#
# `report()` を前例と共通化しないのは、判定表が 3 つのフォルダに割れていて、共有先を作ると
# 判定表 1 本を単体で読めなくなるため。
#
# 合成側が `comment-*` を使うのは、`count.sh` の畳み方が語彙表に載っている綴りで固定されて
# いて、架空の分類では亜種が畳まれないため。
set -uo pipefail

records_dir="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)" || exit 1
trap 'rm -rf "${work:?}"' EXIT
failed=0

report() {
  local expected="$1" actual="$2" label="$3"
  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s\n' "$label"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$actual" "$label"
  failed=1
}

# 一時ツリーを作り直す。常時ロードとスキルの行数は count.sh が持つ予算ちょうどに合わせ、
# ずれを作るケースだけが引数で増減させる。
# 記録は追記で育てるので、**どのケースもここから始める**(作り直さないと前のケースの記録が残る)。
# 引数: <常時ロードの増減> <スキルの増減>
build_tree() {
  local loaded_delta="$1" skill_delta="$2" loaded_budget skill_budget
  rm -rf "${work:?}"/*
  mkdir -p "$work/rules" "$work/.claude/skills/harness-growth" "$work/harness/records"
  cp "$records_dir/count.sh" "$work/harness/records/count.sh"

  loaded_budget="$(sed -n 's/^always_loaded_cap=\([0-9]*\).*/\1/p' "$records_dir/count.sh")"
  skill_budget="$(sed -n 's/^growth_skill_cap=\([0-9]*\).*/\1/p' "$records_dir/count.sh")"

  # 常時ロードは AGENTS.md + rules/*.md の合計。rules/ に 1 行置き、残りを AGENTS.md に置く
  printf 'rule\n' > "$work/rules/sample.md"
  seq "$((loaded_budget - 1 + loaded_delta))" > "$work/AGENTS.md"
  seq "$((skill_budget + skill_delta))" > "$work/.claude/skills/harness-growth/SKILL.md"
}

# 記録を見出しだけで作る。既にあれば何もしない。
# 引数: <番号>
open_record() {
  local path="$work/harness/records/pr-$1.md"
  [ -f "$path" ] || printf '### pr-%s の記録\n\n' "$1" > "$path"
}

# 記録へ 1 行足す。記録が無ければ見出しから作る。
# 行をそのまま受けるのは、バッククォートの無い出どころ・分類の行を伴わない出どころなど、
# 下の 2 つの形に収まらない記録を作るため。
# 引数: <番号> <行>
append_line() {
  open_record "$1"
  printf -- '%s\n' "$2" >> "$work/harness/records/pr-$1.md"
}

# 記録へ指摘を 1 件足す。
# 引数: <番号> <綴り> <出どころ>
write_finding() {
  append_line "$1" "- 分類: \`$2\`"
  append_line "$1" "- 出どころ: \`$3\`"
}

# 記録へ対策済を 1 件足す(その綴りの窓を閉じる)。
# 引数: <番号> <綴り> <層>
write_intervention() {
  append_line "$1" "- 対策済: \`$2\` 層=$3 at pr-$1"
}

# 合成したツリーの count.sh を走らせる。
# 引数: count.sh へそのまま渡す引数
run_count() {
  bash "$work/harness/records/count.sh" "$@"
}

# 既定の表の comment の行を 1 行にして返す。
# 通算・以降まで返すのは、窓の外の件数と窓の長さを壊しても気づけるようにするため。
comment_row() {
  run_count | awk '$5 == "comment" {
    printf "再発=%s 内部=%s 通算=%s 以降=%s 起点=%s", $1, $2, $3, $4, $6
  }'
}

# 窓の数え方。表は `期待|ケース名|記録の指定` で、記録の指定は
# `<番号>:指摘:<綴り>:<出どころ>` または `<番号>:対策済:<綴り>:<層>` の並び。
window_cases='
再発=1 内部=0 通算=1 以降=3 起点=未介入|亜種への対策済は同じ分類の別の亜種の窓を閉じない|10:指摘:comment-beta:レビュー（人） 20:対策済:comment-alpha:hook 30:空:空:空
再発=0 内部=0 通算=1 以降=1 起点=pr-20（層=hook）|分類名そのものへの対策済は全部の窓を閉じる|10:指摘:comment-beta:レビュー（人） 20:対策済:comment:hook 30:空:空:空
再発=1 内部=0 通算=1 以降=2 起点=pr-10（層=hook）|新しい介入が別の綴りにあっても、起点は古いほうの窓とその層になる|10:対策済:comment-beta:hook 20:指摘:comment-beta:レビュー（人） 30:対策済:comment-alpha:skill
再発=1 内部=0 通算=1 以降=2 起点=pr-10（層=hook）|対策済にしか出ない綴りの窓も起点に数える|10:対策済:comment-gamma:hook 20:対策済:comment-beta:hook 30:指摘:comment-beta:レビュー（人）
再発=2 内部=0 通算=2 以降=3 起点=未介入|介入が無ければ全部の指摘が再発に入る|10:指摘:comment-alpha:レビュー（人） 20:指摘:comment-beta:レビュー（人） 30:空:空:空
再発=2 内部=0 通算=2 以降=3 起点=未介入|窓が食い違う綴りが並ぶと、いちばん古いほうが起点になる|10:対策済:comment-alpha:hook 20:指摘:comment-alpha:レビュー（人） 30:指摘:comment-beta:レビュー（人）
再発=1 内部=1 通算=1 以降=3 起点=未介入|サブエージェントの指摘は内部に入り、再発にも通算にも入らない|10:指摘:comment-alpha:レビュー（人） 20:指摘:comment-beta:サブエージェント 30:空:空:空
再発=0 内部=0 通算=1 以降=0 起点=pr-30（層=hook）|窓より前の指摘は通算にだけ残る|10:指摘:comment-alpha:レビュー（人） 20:空:空:空 30:対策済:comment:hook
再発=1 内部=0 通算=1 以降=1 起点=pr-199（層=hook）|PR 番号の桁が増えても窓の前後を取り違えない|199:対策済:comment:hook 1000:指摘:comment-alpha:レビュー（人）
'

printf '%s\n' "窓の数え方"
while IFS='|' read -r expected label spec; do
  [ -n "$expected" ] || continue
  build_tree 0 0
  for entry in $spec; do
    IFS=':' read -r number kind tag source <<< "$entry"
    # `空` の番号は記録だけを 1 本増やす（以降の本数を数える対象にする）
    case "$kind" in
      空) open_record "$number" ;;
      指摘) write_finding "$number" "$tag" "$source" ;;
      *) write_intervention "$number" "$tag" "$source" ;;
    esac
  done
  report "$expected" "$(comment_row)" "$label"
done <<< "$window_cases"

# --list は summary_rows と別に窓を計算するので、片方だけ壊れても表からは分からない。
printf '\n%s\n' "--list"
build_tree 0 0
write_intervention 10 comment-alpha hook
write_finding 20 comment-alpha "レビュー（人）"
write_finding 30 comment-beta "レビュー（人）"
write_finding 40 comment-alpha サブエージェント
listed="$(run_count --list comment | wc -l | tr -d ' ')"
report 3 "$listed" "窓の外の指摘を落とし、窓の中は外部も内部も出す"
build_tree 0 0
write_finding 10 comment-alpha "レビュー（人）"
write_intervention 20 comment hook
closed="$(run_count --list comment | wc -l | tr -d ' ')"
report 0 "$closed" "分類名への対策済で閉じた窓の指摘は出さない"

# --ratchet の終了コード。表は `期待|ケース名|常時ロードの増減|スキルの増減`。
ratchet_cases='
0|予算と一致していれば通る|0|0
1|常時ロードが超過していれば落ちる|1|0
1|常時ロードが予算を下回っていれば落ちる|-1|0
1|スキルが超過していれば落ちる|0|1
1|スキルが予算を下回っていれば落ちる|0|-1
'

printf '\n%s\n' "--ratchet の終了コード"
while IFS='|' read -r expected label loaded_delta skill_delta; do
  [ -n "$expected" ] || continue
  build_tree "$loaded_delta" "$skill_delta"
  run_count --ratchet >/dev/null 2>&1 && status=0 || status=$?
  report "$expected" "$status" "$label"
done <<< "$ratchet_cases"

# --ratchet が出す文言。超過と下回りで直し方が逆なので、終了コードだけでは取り違えを拾えない。
printf '\n%s\n' "--ratchet の文言"
build_tree 1 0
over="$(run_count --ratchet 2>&1 | grep -c '予算を超えています')"
report 1 "$over" "超過では削るよう促す"
build_tree -1 0
under="$(run_count --ratchet 2>&1 | grep -c 'always_loaded_cap')"
report 1 "$under" "下回りでは予算を下げるよう促す"

# --shrink は予算がずれていても止まらない。ずれている回こそ節 2・3 を読みたい。
printf '\n%s\n' "--shrink"
build_tree 1 0
write_finding 10 comment "レビュー（人）"
sections="$(run_count --shrink 2>&1 | grep -cE '^[0-9]+\. ')"
report 3 "$sections" "予算がずれていても節 1〜3 がすべて出る"

exit "$failed"
