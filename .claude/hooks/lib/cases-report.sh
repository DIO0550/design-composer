#!/usr/bin/env bash
#
# 判定表（`*-cases.sh`）が共有する、判定の読み取りと報告と、検出器の種別の照合と、
# 判定表の最後の文の照合。
#
# 使い方: source したうえで `decide`・`normalize_miss`・`all_in_category`・`report` を呼び、最後の文を
# `exit "$cases_failed"` にする（照合するのは `cases-report-cases.sh`）。deny でも exit 0 で JSON を返す
# PreToolUse フックの判定表は、`decide` の代わりに `decide_by_permission` を呼ぶ（フックを流すところから
# 任せるなら `hook_verdict_by_permission`）。ケースの並べ方と検出器の
# 呼び方は、判定表ごとに違う（走査ルートを絶対パスで渡すもの・`cd` してから相対で渡すもの、置くのが
# 1 ファイルか木か）ので、
# そこは各判定表が持つ。検出器の種別を docstring の一覧と照合するなら
# `report_documented_kinds <検出器>`、表の期待がすべての種別を含むかも見るなら
# `report_covered_kinds <検出器> <期待に出た種別>` を呼ぶ。期待に出た種別を表の分類の欄から取るなら
# `kinds_in_categories <表> <接頭辞>` を使う。
#
# **共有先を作ったのは、`.claude/hooks/lib/` の中に同じ関数が 2 本並んだため**
# （`rules/coding.md`「同じ処理が2箇所に現れたら共通化する」）。どの判定表がどの関数を使っているかは
# `.claude/hooks/README.md`「配線」の `lib/cases-report.sh` の行が持つ。
#
# 判定は終了コードと報告の見出しを突き合わせて決める（`decide`）。終了コードを見る理由は
# `.claude/hooks/README.md`「終了コードまで見る」。

# 食い違ったケースがあれば 1 になる。
cases_failed=0

# 検出器の出力と終了コードを突き合わせて、pass / deny / broken を決める。
#
# exit 0 で見出しが無ければ pass、exit 1 で見出しがあれば deny、それ以外（見出しを出したまま exit 0 /
# 見出しの無い exit 1 / exit 0・1 以外）は broken。見出しは $3 に当たる行が 1 行でもあるかを見るので、
# $3 に当たらない見出しを出したまま exit 0 で終わる退行は pass と読む。
#
# $1 検出器の標準出力
# $2 検出器の終了コード
# $3 報告の見出しの正規表現（`grep -E` に渡す）
decide() {
  local output="$1" status="$2" heading="$3" found=""
  grep -qE "$heading" <<<"$output" && found="heading"
  case "$status:$found" in
    0:) echo "pass" ;;
    1:heading) echo "deny" ;;
    *) echo "broken" ;;
  esac
}

# PreToolUse フックの出力と終了コードから、deny / pass / broken を決める。
#
# PreToolUse フックは deny でも exit 0 で JSON を返すので、`decide`（exit 1 かつ見出しありを deny と読む）
# ではなく、出力の `permissionDecision` を見て決める。exit 0 以外は、deny の JSON を出していても broken。
#
# $1 フックの標準出力
# $2 フックの終了コード（deny でも 0）
decide_by_permission() {
  local deny_pattern='"permissionDecision"[[:space:]]*:[[:space:]]*"deny"'
  if [ "$2" -ne 0 ]; then
    echo "broken"
    return 0
  fi
  if [[ "$1" =~ $deny_pattern ]]; then
    echo "deny"
    return 0
  fi
  echo "pass"
}

# 標準入力を PreToolUse フックへ流し、出力と終了コードから deny / pass / broken を返す（`decide_by_permission`）。
#
# $1 フックのパス（`bash` で走らせる。相対なら呼び出し側のカレントディレクトリから辿る）
hook_verdict_by_permission() {
  local output status
  output="$(bash "$1")"
  status=$?
  decide_by_permission "$output" "$status"
}

# 報告が 1 行以上あり、すべての行が期待した見出しで始まるか。違反を分類で報告する検出器の、落とす側の
# ケースに使う。崩したのと別の規則で落ちても終了コードは同じ 1 なので、分類まで見ないと、崩した規則を
# 消しても ok のまま残る。
#
# $1 検出器の報告
# $2 報告の見出しの正規表現（`grep -E` に渡す。行頭から当てる）
all_in_category() {
  local output="$1" heading="$2"
  [ -n "$output" ] || return 1
  ! printf '%s\n' "$output" | grep -vE "$heading" >/dev/null
}

# 意図した取りこぼしは pass になるのが正解なので、表の綴りへ戻す。
#
# $1 表に書かれた期待
# $2 `decide` が返した判定
normalize_miss() {
  local expected="$1" decision="$2"
  if [ "$expected" = "miss" ] && [ "$decision" = "pass" ]; then
    echo "miss"
    return 0
  fi
  echo "$decision"
}

# 1 ケースの結果を 1 行で出す。食い違ったら `cases_failed` を立てる。
#
# $1 表に書かれた期待
# $2 実際の判定
# $3 ケース名
report() {
  local expected="$1" decision="$2" label="$3"
  if [ "$decision" = "$expected" ]; then
    printf 'ok   %-4s %s\n' "$expected" "$label"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$decision" "$label"
  cases_failed=1
}

# 検出器が報告する種別を、実装に書いた順に 1 行 1 つ出す。読む形は 3 つで、`scan()` の
# `found: dict[str, list[str]] = {` に並ぶキー・行頭の `KINDS = (...)`・報告の行の頭
# （`f"[<種別>] `。初出順で重複を除く）。1 本が 2 つの形を持てば連結され、docstring の一覧と
# 食い違う。`{` を含む頭（`f"[{kind}] "`）は拾わない。検出器が `ts_sources.py` の `report` を
# 通さずに `f"[{kind}] "` を自前で書いたときに、それを種別と取り違えないため。
#
# $1 検出器のパス
reported_kinds() {
  sed -nE '/^    found: dict\[str, list\[str\]\] = \{$/,/^    \}$/s/^        "([^"]+)": .*,$/\1/p' "$1"
  sed -nE 's/^KINDS = \((.*)\)$/\1/p' "$1" | grep -oE '"[^"]+"' | tr -d '"'
  grep -oE 'f"\[[^]{}"]+\] ' "$1" | sed -E 's/^f"\[(.*)\] $/\1/' | awk '!seen[$0]++'
}

# 検出器の docstring が「報告する違反は次のとおり」に続けて並べた種別を、上から 1 行 1 つ出す。
# 箇条書き（`- `<種別>` — `）の字下げ 2 の継続行は読み飛ばし、箇条書きの外の行で終わる。
#
# $1 検出器のパス
documented_kinds() {
  sed -nE -e '/^報告する違反は次のとおり/{' -e ':blank' -e 'n' -e '/^$/bblank' \
    -e ':item' -e 's/^- `([^`]+)` — .*$/\1/p' -e ':rest' -e 'n' -e '/^  /brest' -e '/^- /bitem' -e '}' "$1"
}

# 実装と docstring のどちらからも種別を取り出せなかったか。
#
# $1 実装から取り出した種別
# $2 docstring から取り出した種別
nothing_extracted() {
  [ -z "$1" ] && [ -z "$2" ]
}

# 検出器の種別が、docstring の一覧と並びまで一致するかを 1 行で出す。食い違ったら `cases_failed` を立てる。
#
# 種別の一覧は検出器の docstring にだけ書き、README・rules へは写さない。写した一覧は照合されないまま
# 片方だけ古くなる。どちらも 0 件なら取り出しが壊れているので別の NG にする（0 件どうしの一致を
# 照合が通ったと読まないため）。
#
# $1 検出器のパス
report_documented_kinds() {
  local detector="$1" reported documented
  reported="$(reported_kinds "$detector")"
  documented="$(documented_kinds "$detector")"
  if nothing_extracted "$reported" "$documented"; then
    echo 'NG   検出器の種別を実装と docstring のどちらからも取り出せなかった'
    cases_failed=1
    return 0
  fi
  if [ "$reported" != "$documented" ]; then
    printf 'NG   検出器の種別が docstring の一覧と食い違う（実装: %s / docstring: %s）\n' \
      "$(printf '%s' "${reported:-空}" | paste -sd ' ' -)" "$(printf '%s' "${documented:-空}" | paste -sd ' ' -)"
    cases_failed=1
    return 0
  fi
  echo 'ok   検出器の種別が docstring の一覧と一致する'
}

# 表の分類の欄（`|` 区切りの 2 列目）に出た分類を、接頭辞を付けた種別の綴りで 1 行 1 つ出す。
# 分類の無いケース（`-`）は落とす。
#
# $1 判定表（1 行 1 ケース）
# $2 分類を種別の綴りにする接頭辞
kinds_in_categories() {
  printf '%s\n' "$1" | cut -d '|' -f 2 | grep -vx -- '-' | sed "s/^/$2/"
}

# 検出器が報告する種別ごとに、表の期待に出てくるかを 1 行で出す。出てこない種別があれば
# `cases_failed` を立てる。種別を足したときに表が追随しないと、その種別は誰にも守られないまま緑になる。
#
# $1 検出器のパス
# $2 表の期待に出た種別（1 行 1 つ）
report_covered_kinds() {
  local detector="$1" covered="$2" kind
  while IFS= read -r kind; do
    [ -n "$kind" ] || continue
    if printf '%s\n' "$covered" | grep -qxF -- "$kind"; then
      printf 'ok   %s を期待するケースがある\n' "$kind"
    else
      printf 'NG   %s を期待するケースが表に無い\n' "$kind"
      cases_failed=1
    fi
  done <<<"$(reported_kinds "$detector")"
}

# コメント行と空行を除いた、ファイルの最後の行を出す。1 行で書いた文を想定していて、複数行に
# わたる文では、その最後の行が返る。
#
# $1 ファイルのパス
last_statement() {
  grep -vE '^[[:space:]]*(#|$)' "$1" | tail -n 1
}

# 判定表の最後の文が `exit "$cases_failed"` と完全に一致するかを 1 行で出す。違えば `cases_failed` を
# 立てる。
#
# スクリプトの終了コードは最後の文の終了コードなので、この文が無い・後ろに文がある・`exit 0` なら、
# NG を出しても検査が通りうる。綴りを 1 通りに絞るのは、受け付ける形を増やすと照合の側が字句を
# 解釈し始めるため。
# `trap 'exit "$cases_failed"' EXIT` は採らない（判定表がそれぞれ自前の `trap … EXIT` を張っていて
# 上書きされる）。判定表を走らせて終了コードを見る形も採らない（表ごとに要る道具と時間が増える）。
#
# $1 判定表のパス
# $2 報告に出す名前
report_exits_with_cases_failed() {
  local table="$1" label="$2" last
  last="$(last_statement "$table")"
  if [ "$last" = 'exit "$cases_failed"' ]; then
    printf 'ok   %s の最後の文が exit "$cases_failed" になっている\n' "$label"
    return 0
  fi
  printf 'NG   %s の最後の文が exit "$cases_failed" ではない（最後の文: %s）\n' "$label" "${last:-空}"
  cases_failed=1
}
