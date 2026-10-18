#!/usr/bin/env bash
#
# 判定表（`*-cases.sh`）が共有する、判定の読み取りと報告と、検出器の種別の照合。
#
# 使い方: source したうえで `decide`・`normalize_miss`・`all_in_category`・`report` を呼び、最後に
# `cases_failed` を見る。ケースの並べ方と検出器の呼び方は、判定表ごとに違う（走査ルートを
# 絶対パスで渡すもの・`cd` してから相対で渡すもの、置くのが 1 ファイルか木か）ので、
# そこは各判定表が持つ。検出器の種別を docstring の一覧と照合するなら
# `report_documented_kinds <検出器>`、表の期待がすべての種別を含むかも見るなら
# `report_covered_kinds <検出器> <期待に出た種別>` を呼ぶ。期待に出た種別を表の分類の欄から取るなら
# `kinds_in_categories <表> <接頭辞>` を使う。
#
# **共有先を作ったのは、`.claude/hooks/lib/` の中に同じ関数が 2 本並んだため**
# （`rules/coding.md`「同じ処理が2箇所に現れたら共通化する」）。`harness/records/count-cases.sh`
# が共通化を見送っているのは、判定表が 4 つのフォルダに割れていて共有先を置くと判定表 1 本を
# 単体で読めなくなるからで、同じフォルダに並ぶこれらにはその理由が当たらない。
#
# 判定を終了コードで見る理由は `.claude/hooks/README.md`「終了コードまで見る」。

# 食い違ったケースがあれば 1 になる。source した側が最後に見る。
cases_failed=0

# 検出器の出力と終了コードから、deny / pass / broken を決める。
#
# $1 検出器の標準出力
# $2 検出器の終了コード
# $3 報告の見出しの正規表現（`grep -E` に渡す）
decide() {
  local output="$1" status="$2" heading="$3"
  if [ "$status" -ne 1 ]; then
    echo "pass"
    return 0
  fi
  # exit 1 は違反あり。報告の見出しが無いなら判定が壊れている。
  if printf '%s' "$output" | grep -qE "$heading"; then
    echo "deny"
  else
    echo "broken"
  fi
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
# 食い違う。`{` を含む頭（`f"[{kind}] "`）は種別の綴りではないので拾わない。
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
