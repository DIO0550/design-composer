#!/usr/bin/env bash
#
# `count.sh` の数え方の判定表。合成した記録と合成した常時ロードを一時ツリーへ置いて
# `count.sh` のコピーを当て、窓の数え方・畳み込み・`--ratchet` の終了コードが
# 期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash harness/records/count-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら数え方が変わっている。
#
# **合成した記録を入力にするのは、実データ(`pr-*.md`)がマージのたびに 1 本増えるため。**
# 実データの出力をそのまま期待値にすると、記録 PR のたびに期待値の更新が要る形になり、
# 固定しているのが数え方ではなくその日のデータになる。
#
# **bash と awk・sed・seq だけで書く。** `count.sh` 自身が python3 も jq も使わずに
# 走る以上、その判定表が別のものを要求すると、ラチェットが効いている環境で判定表だけが
# 効かない(または逆に push が落ちる)組み合わせができる。同じ形の前例は
# `.claude/hooks/lib/result-option-read-cases.sh`(判定表を対象の隣へ置く)。
#
# **予算は `count.sh` から読み出す。** 値を書き写すと、予算を下げた回にこの表も
# 直さないと落ちる。合成する行数のほうを読み出した予算へ合わせる。
#
# `--ratchet` を終了コードで見る理由は `.claude/hooks/README.md`「終了コードまで見る」。
#
# **`--shrink` と `--list` の使い方エラーは対象外。** `--shrink` 節 2 は `summary_rows` の
# 上に独自の閾値と整形を重ねており入力側を固定しても守れないが、それも `--list` の
# `exit 2` も、この表のゴール(窓の数え方と `--ratchet` の終了コード)の外なので据え置く。
set -uo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

tree="$work/tree"
records_dir="$tree/harness/records"
count="$records_dir/count.sh"
mkdir -p "$records_dir" "$tree/rules" "$tree/.claude/skills/harness-growth"
cp "$(dirname "$0")/count.sh" "$count"

always_loaded_cap="$(sed -n 's/^always_loaded_cap=//p' "$count")"
growth_skill_cap="$(sed -n 's/^growth_skill_cap=//p' "$count")"
failed=0

# 1 ケースの結果を 1 行で報告する。食い違えば `failed` を立てる。
report() {
  local expected="$1" actual="$2" label="$3"
  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   期待=[%s] 実際=[%s]\n     %s\n' "$expected" "$actual" "$label"
  failed=1
}

# 空白区切りの語を昇順に並べ替える。
sort_words() {
  printf '%s\n' $1 | LC_ALL=C sort | tr '\n' ' ' | sed 's/ $//'
}

# 記録の 1 行を Markdown にする。書式は `harness-record` の record.md に合わせる。
# 受け取る綴りは次の 4 つ。
#   `<分類の綴り> <出どころ>`        … 指摘 1 件(見出し付き)
#   `対策済 <綴り> <層> <pr 番号>`   … その綴りの窓を閉じる行
#   `分類のみ <綴り>`                … 出どころを持たない分類の行
#   `出どころのみ <出どころ>`        … 分類を持たない出どころの行
record_line() {
  set -- $1
  case "$1" in
    対策済) printf -- '- 対策済: `%s` 層=%s at pr-%s\n' "$2" "$3" "$4"; return ;;
    分類のみ) printf -- '- 分類: `%s`\n' "$2"; return ;;
    出どころのみ) printf -- '- 出どころ: %s\n' "$2"; return ;;
  esac
  local spelling="$1"
  shift
  printf -- '### %s\n\n- 分類: `%s`\n- 出どころ: %s\n\n' "$spelling" "$spelling" "$*"
}

# 1 記録を書き出す。引数: <書き出し先> <記録番号> <行>...
write_record() {
  local path="$1" number="$2" line
  shift 2
  printf '# pr-%s\n\n' "$number" > "$path"
  for line in "$@"; do
    record_line "$line" >> "$path"
  done
}

# 合成した記録を一時ツリーへ書き出す。引数は 1 記録 1 つで `<番号>;<行>;<行>...`。
# 行の綴りは `record_line` のとおり。行を 1 つも持たない記録は指摘 0 件の回を表す。
write_records() {
  rm -f "$records_dir"/pr-*.md
  local spec entries
  for spec in "$@"; do
    IFS=';' read -ra entries <<< "$spec"
    write_record "$records_dir/pr-${entries[0]}.md" "${entries[0]}" "${entries[@]:1}"
  done
}

# 既定の表の分類列を、出力の並びのまま空白区切りで返す。
summary_tags() {
  bash "$count" | tail -n +2 | awk '{ print $5 }' | tr '\n' ' ' | sed 's/ $//'
}

# 既定の表を当て、指定した分類の行を `再発 内部 通算 以降 起点` で比べる。
# 引数: <期待値> <分類> <ラベル> <記録>...
run_summary_case() {
  local expected="$1" tag="$2" label="$3"
  shift 3
  write_records "$@"
  report "$expected" "$(bash "$count" | awk -v t="$tag" '$5 == t { print $1, $2, $3, $4, $6 }')" "$label"
}

# 既定の表に出た分類を比べる。`並び` は出力の順のまま、`集合` は昇順に並べ替えてから比べる。
# 引数: <期待する分類> <並び|集合> <ラベル> <記録>...
run_tags_case() {
  local expected="$1" mode="$2" label="$3" actual
  shift 3
  write_records "$@"
  actual="$(summary_tags)"
  [ "$mode" = "集合" ] && actual="$(sort_words "$actual")"
  report "$expected" "$actual" "$label"
}

# `--list` を当て、出た指摘を `pr-<番号>:<出どころ>:<見出し>` の並びで比べる。
# 引数: <期待値> <分類> <ラベル> <記録>...
run_list_case() {
  local expected="$1" tag="$2" label="$3" actual
  shift 3
  write_records "$@"
  actual="$(bash "$count" --list "$tag" | awk '{ printf "%s:%s:%s ", $1, $2, $3 }')"
  report "$expected" "${actual% }" "$label"
}

# 指定した行数のファイルを作る。末尾改行が無いと `wc -l` がずれるので seq で作る。
write_lines() {
  seq "$2" | sed 's/^/行 /' > "$1"
}

# 常時ロードと harness-growth スキルの行数を合成し、`--ratchet` を当てる。
# 報告は常に 2 行(常時ロードと harness-growth)出ることも毎回見る。片方が落ちた時点で
# 止まると、もう片方のずれが次の push まで隠れる。
# 引数: <期待する終了コード> <常時ロードの行数> <harness-growth の行数> <ラベル> <報告に出てほしい綴り>...
run_ratchet_case() {
  local expected_status="$1" loaded="$2" growth="$3" label="$4" output status=0 actual wanted
  shift 4
  # 常時ロードは AGENTS.md と rules/*.md の合計。rules/ が空だと glob が展開されず落ちる
  write_lines "$tree/rules/architecture.md" 3
  write_lines "$tree/AGENTS.md" "$((loaded - 3))"
  write_lines "$tree/.claude/skills/harness-growth/SKILL.md" "$growth"
  output="$(bash "$count" --ratchet)" || status=$?
  actual="exit=$status 報告=$(printf '%s\n' "$output" | grep -c .) 行"
  for wanted in "$@"; do
    printf '%s\n' "$output" | grep -qF "$wanted" && continue
    actual="$actual / 出ない綴り: $wanted"
  done
  report "exit=$expected_status 報告=2 行" "$actual" "$label"
}

# --- 窓の数え方(既定の表) ---

run_summary_case '2 0 2 3 未介入' naming \
  '対策済が 1 件も無い分類は、起点が「未介入」で、以降が指摘 0 件の回を含む記録の本数になる' \
  '10;naming レビュー（人）' \
  '20' \
  '30;naming CI'

run_summary_case '1 0 2 1 pr-20（層=hook）' naming \
  '対策済より後の指摘だけが再発と内部に入り、前の指摘は通算にだけ残る' \
  '10;naming レビュー（人）;naming レビュー（plan-reviewer）' \
  '20;対策済 naming hook 20' \
  '30;naming CI'

run_summary_case '0 0 2 1 pr-20（層=hook）' naming \
  '対策済と同じ記録に載っている指摘は再発に入らない（通算にだけ残る）' \
  '20;naming レビュー（人）;naming CI;対策済 naming hook 20' \
  '30'

run_summary_case '0 4 0 1 未介入' naming \
  '出どころがサブエージェント・フック・自己修正の指摘は内部に入り、再発には入らない' \
  '10;naming レビュー（plan-reviewer）;naming レビュー（implementation-reviewer）;naming フック;naming 自己修正'

run_summary_case '4 0 4 1 未介入' naming \
  'バッククォートで囲まれていても囲まれていなくても、同じ出どころは同じに数えられる' \
  '10;naming レビュー;naming `レビュー`;naming レビュー（人）;naming `レビュー（人）`'

run_summary_case '7 0 7 1 未介入' naming \
  '人・bot を表す別名 7 つ（人間 / 人 / human / オーナー / owner / Copilot / bot）はすべて再発に入る' \
  '10;naming レビュー（人間）;naming レビュー（人）;naming レビュー（human）;naming レビュー（オーナー）;naming レビュー（owner）;naming レビュー（Copilot）;naming レビュー（bot）'

run_summary_case '3 1 3 1 未介入' naming \
  '`CI` で始まる出どころは再発に入り、`CI` を括弧の中に持つだけの `自己修正（CI の結果）` は内部に入る' \
  '10;naming CI;naming `CI`;naming CI（カバレッジ報告）;naming 自己修正（CI の結果）'

run_summary_case '1 0 1 1 未介入' naming \
  '分類の行に続く 2 つ目の出どころは数えられない' \
  '10;naming レビュー（人）;出どころのみ CI'

run_tags_case 'naming' 並び \
  '分類の行を持たない出どころは、分類の無い行を作らない' \
  '10;naming レビュー（人）;出どころのみ CI'

run_tags_case 'naming' 集合 \
  '出どころの行を持たない分類は、指摘としても分類の行としても数えられない' \
  '10;分類のみ orphan-tag;naming レビュー（人）'

run_tags_case 'comment dependency duplication harness naming over-guard ownership plan react test type ui' 集合 \
  '旧語彙の綴りは現在の語彙へ畳まれ、対応表に無い綴りはその綴りのまま 1 行になる' \
  '10;ownership-attribution レビュー（人）;domain-placement レビュー（人）;logic-ownership レビュー（人）;service-placement レビュー（人）;utils-form レビュー（人）;layer-dependency レビュー（人）;module-api レビュー（人）;companion-object レビュー（人）;immutability レビュー（人）;result-option レビュー（人）;signature レビュー（人）;type-vocabulary レビュー（人）;illegal-state レビュー（人）;duplication-logic レビュー（人）;naming-generic-word レビュー（人）;comment-enumeration-drift レビュー（人）;test-coverage レビュー（人）;effect レビュー（人）;state-management レビュー（人）;ref-guard レビュー（人）;composition レビュー（人）;nested-interactive-event-boundary レビュー（人）;ui-plan-misread レビュー（人）;vrt-blind-spot レビュー（人）;drag-feedback-incomplete レビュー（人）;plan-goal-verification レビュー（人）;version-bump-unverified レビュー（人）;rules-consistency レビュー（人）;docs-consistency レビュー（人）;subagent-control レビュー（人）;hook-environment レビュー（人）;tooling-rule-scope-gap レビュー（人）;harness-process-drift レビュー（人）;tool-behavior-unverified レビュー（人）;over-guard レビュー（人）'

run_tags_case 'dependency module-api-bypass' 集合 \
  '完全一致で畳む綴りは、接尾辞が付くと畳まれず別の行になる' \
  '10;module-api レビュー（人）;module-api-bypass レビュー（人）'

run_summary_case '1 0 2 3 未介入' naming \
  '亜種の綴りへ介入しても、同じ分類へ畳まれる別の綴りの窓は閉じない' \
  '10;naming-generic-word レビュー（人）' \
  '20;対策済 naming-generic-word hook 20' \
  '30;naming-file-name CI'

run_summary_case '1 0 2 1 pr-20（層=hook）' naming \
  '分類名そのものへの対策済は、その分類へ畳まれる綴りすべての窓を閉じる' \
  '10;naming-generic-word レビュー（人）' \
  '20;対策済 naming hook 20' \
  '30;naming-file-name CI'

run_summary_case '1 0 2 1 pr-100（層=rules）' naming \
  '同じ綴りに対策済が 2 つあれば、記録を読む順ではなく番号の新しいほうが窓になる' \
  '20;対策済 naming hook 20' \
  '100;naming レビュー（人）;対策済 naming rules 100' \
  '110;naming CI'

run_summary_case '2 0 2 2 pr-10（層=hook）' naming \
  '2 つの綴りがどちらも介入済みで層が違うとき、起点は古いほうの PR と、その窓の層になる' \
  '10;対策済 naming-generic-word hook 10' \
  '40;対策済 naming-file-name 判例 40' \
  '50;naming-generic-word CI;naming-file-name CI'

# 「対策済にしか出ない綴りの窓も数える」は、それを変える提案が別に出ている論点。
# 現状の答えを固定しておかないと、後で変えたときに、狙って変えたのか変えたつもりが
# 無いのに変わったのかが読めない。
run_summary_case '1 0 2 3 pr-50（層=rules）' naming \
  '指摘が 1 件も無い綴りの対策済も、起点と以降を伸ばす' \
  '50;対策済 naming-file-name rules 50' \
  '60;naming-generic-word レビュー（人）' \
  '70;対策済 naming-generic-word hook 70' \
  '80;naming-generic-word CI'

run_tags_case 'test naming comment' 並び \
  '既定の表は再発の多い順に並び、再発が同数なら内部の多い順になる' \
  '10;test レビュー（人）;test レビュー（人）;naming レビュー（人）;naming レビュー（plan-reviewer）;naming レビュー（plan-reviewer）;naming レビュー（plan-reviewer）;comment レビュー（人）;comment レビュー（plan-reviewer）'

# --- --list ---

run_list_case 'pr-30:CI:naming' naming \
  '`--list` は窓が開いてからの指摘だけを出す（対策済と同じ記録のものは出さない）' \
  '20;naming レビュー（人）;対策済 naming hook 20' \
  '30;naming CI'

run_list_case 'pr-20:CI:naming pr-10:レビュー（plan-reviewer）:naming' naming \
  '`--list` は人・bot・CI 由来を先に並べる' \
  '10;naming レビュー（plan-reviewer）' \
  '20;naming CI'

run_list_case 'pr-10:レビュー（人）:naming-generic-word' naming \
  '`--list` に分類名を渡すと、その分類へ畳まれる別の綴りの指摘が、見出しと素の出どころで出る' \
  '10;naming-generic-word `レビュー（人）`' \
  '20;module-api レビュー（人）'

# --- --ratchet ---

run_ratchet_case 0 "$always_loaded_cap" "$growth_skill_cap" \
  '実測が予算と一致すれば exit 0 で、両方の実測が報告される' \
  "常時ロード(AGENTS.md + rules/): $always_loaded_cap / $always_loaded_cap 行" \
  "harness-growth/SKILL.md: $growth_skill_cap / $growth_skill_cap 行"

run_ratchet_case 1 "$((always_loaded_cap + 1))" "$growth_skill_cap" \
  '常時ロードが予算を超えていれば exit 1 で、超過として報告される' \
  "常時ロード(AGENTS.md + rules/) が予算を超えています: $((always_loaded_cap + 1)) / $always_loaded_cap 行"

run_ratchet_case 1 "$((always_loaded_cap - 1))" "$growth_skill_cap" \
  '常時ロードが予算を下回れば exit 1 で、下げ先の変数名と値が報告される' \
  "count.sh の always_loaded_cap を $((always_loaded_cap - 1)) へ下げる(上げない)"

run_ratchet_case 1 "$always_loaded_cap" "$((growth_skill_cap - 1))" \
  'harness-growth スキルが予算を下回れば exit 1 で、下げ先が `growth_skill_cap` として報告される' \
  "count.sh の growth_skill_cap を $((growth_skill_cap - 1)) へ下げる(上げない)"

run_ratchet_case 1 "$((always_loaded_cap + 1))" "$((growth_skill_cap - 1))" \
  '常時ロードが落ちても harness-growth スキルの検査は飛ばされない（2 つとも報告される）' \
  "常時ロード(AGENTS.md + rules/) が予算を超えています" \
  "harness-growth/SKILL.md が予算を下回りました"

exit "$failed"
