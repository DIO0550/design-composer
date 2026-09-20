#!/usr/bin/env bash
#
# `count.sh` の判定表。合成した記録と合成した常時ロードを置いた一時ツリーへ `count.sh` を
# 当て、`count.sh` の全モードの判定が期待どおりかを 1 コマンドで確かめる。見ている観点は
# 下の各節の見出しが持つ。
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
# 合成側が語彙表(`.claude/skills/harness-record/templates/record.md`)に載っている綴りを使うのは、
# `count.sh` の畳み方と読み分けがその綴りで固定されていて、架空の分類・出どころでは亜種が
# 畳まれず、読み分けも踏めないため。
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

# comment の指摘が再発と内部のどちらに数えられたかを返す。
# `comment_row` と同じ行を読むが、返すのは行き先だけにする。件数まで返すと、出どころ 1 件を
# 差し替えるだけのケースが窓の長さや通算まで固定してしまうため。
comment_counted_as() {
  run_count | awk '$5 == "comment" {
    print ($1 == 1) ? "再発" : (($2 == 1) ? "内部" : "どちらでもない")
  }'
}

# 既定の表に出た分類を、集合として(並べ替えて) 1 行にして返す。
tag_set() {
  run_count | awk 'NR > 1 {print $5}' | sort | paste -sd' ' -
}

# 既定の表の並べ替えキー(再発と内部)を、出力に現れた並びのまま `<再発>:<内部>` で返す。
row_order_keys() {
  run_count | awk 'NR > 1 {print $1 ":" $2}' | paste -sd' ' -
}

# --list の出力から列を 1 つ取り出し、`/` で繋いで 1 行にして返す。
# 列の区切りを空白 2 個以上で取るのは、出どころの綴り自体が空白を含むため
# (実記録の `フック（`Edit` の外部変更検知）` など)。区切りが `/` なのは、見出しも空白を含むため。
# 引数: <分類> <番号|出どころ|見出し>
listed_column() {
  run_count --list "$1" | awk -v column="$2" '{
    rest = $0; sub(/^[^ ]+ +/, "", rest)
    source = rest; sub(/  +.*$/, "", source)
    heading = substr(rest, length(source) + 1); sub(/^ +/, "", heading)
    if (column == "番号") value = $1
    else if (column == "出どころ") value = source
    else if (column == "見出し") value = heading
    else value = "未知の列:" column
    printf "%s%s", sep, value; sep = "/"
  }'
}

# `/` で繋いだ 1 行を、並べ替えて繋ぎ直す。
# 並びを問わない列で挟むのは、`--list` の並べ替えを落とす変異が全部の列を同時に落とし、
# 1 つの assert が「どの行が出るか」と「どの順で出るか」の 2 仕様を固定してしまうため。
# 並びの固定は番号列のケース 1 つに集約する。
sorted_values() {
  tr '/' '\n' | sort | paste -sd'/' -
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
再発=1 内部=1 通算=1 以降=3 起点=未介入|サブエージェントの指摘は内部に入り、再発にも通算にも入らない|10:指摘:comment-alpha:レビュー（人） 20:指摘:comment-beta:レビュー（implementation-reviewer） 30:空:空:空
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
      対策済) write_intervention "$number" "$tag" "$source" ;;
      *) report "空|指摘|対策済" "$kind" "記録の指定の綴り" ;;
    esac
  done
  report "$expected" "$(comment_row)" "$label"
done <<< "$window_cases"

# 旧語彙は読むときに現在の分類へ畳む(count.sh の fold_tag)。対応表の 1 行が落ちると
# その綴りが畳まれずに残るので、出た分類の集合で見る。1 本の記録に全綴りを置くのは、
# 1 回読むだけで対応表の全行を踏めるため。
# 対応表が `|` で並べている綴りは、1 つだけ落としても残りの綴りで行が踏めてしまうので、
# 並んでいる綴りをすべて置く。`*` 1 つで受けている 4 行(duplication / naming / comment /
# test)だけは 1 件で足りる。
# 期待値に `over-guard` と `なし` が無いのは、この 2 つが旧語彙を持たず fold_tag に行が
# 無いため(語彙表は 13 行だが、畳み方の対応表は 11 行)。
old_spellings='ownership-attribution domain-knowledge logic-ownership service-placement utils-form
layer-dependency module-api
companion-object immutability result-option signature type-vocabulary illegal-state
duplication-helper
naming-mismatch
comment-why
test-assert
effect state-management ref-guard composition nested-interactive-event-boundary
ui-verification vrt-blind-spot drag-feedback-incomplete
plan-scope version-bump-unverified
rules-consistency docs-consistency subagent-control hook-environment tooling-rule-scope-gap harness-process-drift tool-behavior-unverified'

printf '\n%s\n' "分類の畳み方"
build_tree 0 0
for spelling in $old_spellings; do
  write_finding 10 "$spelling" "レビュー（人）"
done
report "comment dependency duplication harness naming ownership plan react test type ui" \
  "$(tag_set)" "旧語彙の綴りは現在の分類へ畳まれる"

# 出どころの読み分け(count.sh の reached_outside)。表は `期待|ケース名|出どころ`。
# 分類を 1 つに固定して出どころだけを差し替えるので、見えるのは行き先だけになる。
# 別名・前方一致・バッククォートの有無を 1 件ずつ置くのは、正規表現から綴りを 1 つ落としても
# 残りのケースが通ってしまい、落ちた分だけが NG になるようにするため。
# 綴りはバッククォートの有無まで実記録にある形を採った。出どころの値として実記録に無いのは
# `レビュー（owner）`・`レビュー（Copilot）`・バッククォート付きの `レビュー` の 3 つで、
# 正規表現に載っているので置く(`レビュー（Copilot）` は他の綴りの補足として 1 件だけ本文に出る)。
# 内部側の `レビュー（plan-reviewer）` は、素の `レビュー` の行末アンカーを外す変異も落とす。
source_cases='
再発|バッククォート付きの `レビュー（人）`|`レビュー（人）`
再発|バッククォートの無い レビュー（人）|レビュー（人）
再発|別名「人間」|レビュー（人間）
再発|別名「human」|レビュー（human）
再発|別名「オーナー」|レビュー（オーナー）
再発|別名「owner」|レビュー（owner）
再発|別名「Copilot」|レビュー（Copilot）
再発|別名「bot」|`レビュー（bot）`
再発|括弧の無い レビュー|レビュー
再発|バッククォート付きで括弧の無い `レビュー`|`レビュー`
再発|CI|CI
再発|バッククォート付きの `CI`|`CI`
再発|CI で始まる出どころ|CI（カバレッジ報告）
内部|括弧の中が別名でない レビュー|`レビュー（plan-reviewer）`
内部|CI で始まらない 自己修正|自己修正（CI の結果）
内部|フック|フック
'

printf '\n%s\n' "出どころの読み分け"
while IFS='|' read -r expected label source; do
  [ -n "$expected" ] || continue
  build_tree 0 0
  append_line 10 '- 分類: `comment-alpha`'
  append_line 10 "- 出どころ: $source"
  report "$expected" "$(comment_counted_as)" "$label"
done <<< "$source_cases"

# 分類の行が `pending` に入り、出どころの行で 1 件として確定する。記録が崩れていても
# 数えすぎないための境界なので、崩れた形を置いて見る。
printf '\n%s\n' "分類と出どころの対応"
build_tree 0 0
append_line 10 '- 分類: `comment-alpha`'
append_line 10 '- 出どころ: `レビュー（人）`'
append_line 10 '- 出どころ: `レビュー（人）`'
report "再発=1 内部=0 通算=1 以降=1 起点=未介入" "$(comment_row)" \
  "1 つの分類に出どころが 2 行あっても指摘は 1 件"
build_tree 0 0
append_line 10 '- 出どころ: `レビュー（人）`'
append_line 10 '- 分類: `comment-alpha`'
append_line 10 '- 出どころ: `レビュー（人）`'
report "comment" "$(tag_set)" "分類の行が無い出どころの行はどの分類にも数えない"

# 対策済を書いた回に、同じ分類の指摘がその回の記録へ載っていることがある。その指摘は
# 窓が開くのと同じ番号なので、窓の外(通算にだけ残る)として扱う。既定の表と --list が
# 窓を別々に計算しているので、境界は両方から見る。
# 次の記録(pr-30)の指摘を対照に置くのは、これが無いと「何も数えない」実装でも通るため。
printf '\n%s\n' "対策済と同じ記録の指摘"
build_tree 0 0
write_intervention 20 comment-alpha hook
write_finding 20 comment-alpha "レビュー（人）"
write_finding 30 comment-alpha "レビュー（人）"
report "再発=1 内部=0 通算=2 以降=1 起点=pr-20（層=hook）" "$(comment_row)" \
  "対策済と同じ記録の指摘は再発に入らず、次の記録の指摘だけが再発に入る"
report "pr-30" "$(listed_column comment 番号)" \
  "対策済と同じ記録の指摘は --list に出ず、次の記録の指摘だけが出る"

# --list は summary_rows と別に窓を計算するので、片方だけ壊れても表からは分からない。
# 内部の指摘を先に、外部の指摘を後に書くのは、記録の並びと出力の並びを食い違わせて
# 「外部を先に出す」を固定するため(同じ並びにすると、並べ替えを落としても通る)。
printf '\n%s\n' "--list"
build_tree 0 0
write_finding 20 comment-alpha "レビュー（implementation-reviewer）"
write_finding 30 comment-beta "レビュー（人）"
write_finding 40 comment-alpha "レビュー（人）"
report "pr-30/pr-40/pr-20" "$(listed_column comment 番号)" \
  "外部の指摘を先に、内部の指摘を後に出す"
report "レビュー（implementation-reviewer）/レビュー（人）/レビュー（人）" \
  "$(listed_column comment 出どころ | sorted_values)" "出どころはバッククォートを外して出す"
report "pr-20 の記録/pr-30 の記録/pr-40 の記録" \
  "$(listed_column comment 見出し | sorted_values)" "記録の見出しを添えて出す"
build_tree 0 0
write_finding 10 comment-alpha "レビュー（人）"
write_intervention 20 comment hook
write_finding 30 comment-alpha "レビュー（人）"
report "pr-30" "$(listed_column comment 番号)" \
  "分類名への対策済で閉じた窓より前の指摘は出さない"
# 対照の綴りを素の `naming` ではなく `naming-a` にするのは、畳んだ後の分類で絞っていることまで
# 固定するため(素の `naming` だと、fold_tag を通さずに綴りを比べる実装でも通る)。
build_tree 0 0
write_finding 10 comment-alpha "レビュー（人）"
write_finding 20 naming-a "レビュー（人）"
report "pr-10" "$(listed_column comment 番号)" \
  "指定した分類へ畳まれない指摘は出さない"

# 既定の表は再発の多い順、同数なら内部の多い順に並べる。分類ごとにキーを変えるのは、
# 同じ値が並ぶと並べ替えの有無が出力に出ないため。
# 期待値を `for (tag in tags)` の並びではなくキーの降順に置くのは、`for (in)` の並びが awk の
# 実装依存で、固定すると awk が変わった日に判定表のほうが落ちるため(mawk と nawk はどちらも
# この 4 つを naming → comment → test → ui の順に返すので、並べ替えを落とすと降順から外れる)。
# 表は `<綴り>:<再発の件数>:<内部の件数>`。
tag_counts='naming-a:4:0 comment-a:2:0 test-a:3:0 ui-a:2:1'

printf '\n%s\n' "既定の表の並び"
build_tree 0 0
for entry in $tag_counts; do
  IFS=':' read -r spelling outside inside <<< "$entry"
  for _ in $(seq "$outside"); do write_finding 10 "$spelling" "レビュー（人）"; done
  for _ in $(seq "$inside"); do write_finding 10 "$spelling" "レビュー（implementation-reviewer）"; done
done
report "4:0 3:0 2:1 2:0" "$(row_order_keys)" "分類は再発の多い順、同数なら内部の多い順に並ぶ"

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
# 下回りは予算を持つ変数名まで見る。変数名は下回りの文言にしか出ないので、2 つの予算を
# 取り違えても終了コードは変わらない。
printf '\n%s\n' "--ratchet の文言"
build_tree 1 0
over="$(run_count --ratchet 2>&1 | grep -c '予算を超えています')"
report 1 "$over" "超過では削るよう促す"
build_tree -1 0
under_loaded="$(run_count --ratchet 2>&1 | grep -c 'always_loaded_cap')"
report 1 "$under_loaded" "常時ロードの下回りでは always_loaded_cap を下げるよう促す"
build_tree 0 -1
under_skill="$(run_count --ratchet 2>&1 | grep -c 'growth_skill_cap')"
report 1 "$under_skill" "スキルの下回りでは growth_skill_cap を下げるよう促す"

# --shrink は予算がずれていても止まらない。ずれている回こそ節 2・3 を読みたい。
printf '\n%s\n' "--shrink"
build_tree 1 0
write_finding 10 comment "レビュー（人）"
sections="$(run_count --shrink 2>&1 | grep -cE '^[0-9]+\. ')"
report 3 "$sections" "予算がずれていても節 1〜3 がすべて出る"

exit "$failed"
