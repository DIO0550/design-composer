#!/usr/bin/env bash
#
# 解説の検査の判定表。一時リポジトリに抜粋の元になるファイルをコミットし、見本の解説
# (`.claude/skills/pr-explain/templates/explain.json`)を 1 か所ずつ崩して `build-pr-explain.py`
# へ流し、落ちる分類と書き出したものが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/build-pr-explain-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 落ちるケースは、報告の行がすべて期待した分類であることまで見る(`all_in_category`)。
#
# **地図を指す参照を通すケースが要。** 見ない理由は `build-pr-explain.py` の冒頭。
#
# 表は `期待|分類|基準|ケース名|変形` の 1 行 1 ケース。基準(`sample` = 見本 / `minimal` = 必須の
# キーだけ)を変数 `d` に読み、変形(Python の文)を当てて検査する。変形が `raw` に文字列を入れたら、
# それをそのまま解説のファイルにする。表の下のケースは、書き出したものの中身を見る。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
builder="$scripts_dir/build-pr-explain.py"
sample="$repo_root/.claude/skills/pr-explain/templates/explain.json"
work="$(mktemp -d)" || exit 1
trap 'rm -rf "$work"' EXIT

# 外側のリポジトリを指す git の環境変数を落とす(立ったまま一時ディレクトリで git を使うと、
# 本物のリポジトリを触る)。
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

source "$repo_root/.claude/hooks/lib/cases-report.sh"

repo="$work/repo"
git init --quiet -b main "$repo"
git -C "$repo" config user.name cases
git -C "$repo" config user.email cases@example.com
printf 'one\ntwo\nthree\nfour\nfive\n' > "$repo/kept.txt"
printf 'a\nb' > "$repo/noeol.txt"
mkdir -p "$repo/sub"
git -C "$repo" add -A && git -C "$repo" commit --quiet -m explained
sha="$(git -C "$repo" rev-parse HEAD)"
# 解説を書いた後の編集。抜粋は解説時点の sha から読むので載らない(作業ツリーを読む実装なら載る)。
printf 'ONE\nTWO\nTHREE\nFOUR\nFIVE\nSIX\n' > "$repo/kept.txt"

# 見本の sha をこのリポジトリのコミットにした基準と、必須のキーだけの基準。
python3 - "$sample" "$sha" "$work" <<'PY'
import json, sys
sample, sha, work = sys.argv[1:4]
explain = {**json.load(open(sample, encoding="utf-8")), "sha": sha}
minimal = {"version": 1, "pr": explain["pr"], "sha": sha, "overview": {"title": "題", "lead": "要約", "before": [], "after": [{"text": "後"}]}}
for name, value in (("sample", explain), ("minimal", minimal)):
    open(f"{work}/{name}.json", "w", encoding="utf-8").write(json.dumps(value, ensure_ascii=False))
PY
pr="$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["pr"])' "$sample")"

# 基準に変形を当てて、解説のファイルを作る。
# $1 基準, $2 変形(Python の文。`d` が基準、`raw` に入れた文字列はそのままファイルになる)
make_case() {
  python3 - "$work/$1.json" "$work/case.json" "$2" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
raw = None
exec(sys.argv[3])
open(sys.argv[2], "w", encoding="utf-8").write(raw if raw is not None else json.dumps(d, ensure_ascii=False))
PY
}

# $1 期待する分類(`pass` のケースでは使わない)。pass / deny のほか、食い違いの形を返す。
verdict() {
  local category="$1" output status
  rm -f "$work/out.json"
  output="$(python3 "$builder" "$work/case.json" --pr "$pr" --out "$work/out.json" --repo "$repo" 2>&1)"; status=$?
  case "$status" in
    0) [ -f "$work/out.json" ] && echo pass || echo unwritten ;;
    1)
      if [ -e "$work/out.json" ]; then echo written; return; fi
      if all_in_category "$output" "^\[pr-explain-$category\] "; then
        echo deny
      else
        echo "other-category"
      fi
      ;;
    *) echo "exit-$status" ;;
  esac
}

cases="$(cat <<'CASES'
pass|-|sample|見本(Target の 5 つの kind をすべて使う)は通る|assert sorted(h["go"]["kind"] for h in d["overview"]["highlights"]) == ["feature", "file", "flow", "layer", "message"]
pass|-|minimal|必須のキーだけの解説は通る|
pass|-|sample|地図にしか無いもの(commitStory の sha・Note のパスと行・Target の layer / file・LayerRole・concept)は落とさない|d["commitStories"][0]["sha"] = "e" * 40; d["tests"][0]["commit"] = "e" * 40; d["commitStories"][0]["notes"][0].update(path="no/such.ts", start=900, end=901); d["overview"]["highlights"][1]["go"]["layer"] = "地図に無い層"; d["overview"]["highlights"][2]["go"]["path"] = "no/such"; d["layerRoles"][0]["layer"] = "地図に無い層"; d["concepts"].append({"path": "no/such.ts", "name": "無い", "role": "地図に無い"})
deny|shape|sample|JSON として読めない|raw = "{"
deny|shape|sample|version が 1 でない|d["version"] = 2
deny|shape|sample|必須のキー(overview)が無い|del d["overview"]
deny|shape|sample|トップに知らないキー|d["extra"] = 1
deny|shape|sample|入れ子(Message)に知らないキー|d["messages"][0]["extra"] = "x"
deny|shape|sample|入れ子(Overview)で同じキーを 2 回書く|raw = json.dumps(d, ensure_ascii=False).replace('"lead": ', '"lead": "重複", "lead": ', 1)
deny|shape|sample|before が配列でなく文字列|d["overview"]["before"] = "前"
deny|shape|sample|after の要素が Behavior でなく文字列|d["overview"]["after"] = ["後"]
deny|shape|sample|語彙の外の message の kind|d["messages"][0]["kind"] = "command"
deny|shape|sample|語彙の外の via|d["messages"][0]["via"] = "rpc"
deny|shape|sample|語彙の外の phase|d["commitStories"][0]["phase"] = "polish"
deny|shape|sample|語彙の外の technique|d["tests"][0]["techniques"] = ["fuzz"]
deny|shape|sample|語彙の外の message の status|d["messages"][1]["status"] = "new"
deny|shape|sample|トップの sha が 40 桁でない|d["sha"] = d["sha"][:39]
deny|shape|sample|commitStory の sha が 40 桁でない|d["commitStories"][0]["sha"] = "89abcdef"
deny|shape|sample|id が - で始まる|d["tests"][1]["id"] = "-stale"
deny|shape|sample|messages の id が重複|d["messages"].append(dict(d["messages"][0]))
deny|shape|sample|features の id が重複|d["features"].append(dict(d["features"][0]))
deny|shape|sample|flows の id が重複|d["flows"].append(dict(d["flows"][0]))
deny|shape|sample|suites の id が重複|d["suites"].append(dict(d["suites"][0]))
deny|shape|sample|tests の id が重複|d["tests"].append(dict(d["tests"][1]))
deny|shape|sample|commitStories の sha が重複|d["commitStories"].append(dict(d["commitStories"][0]))
deny|shape|sample|concepts の path が重複|d["concepts"].append(dict(d["concepts"][0]))
deny|shape|sample|layerRoles の layer が重複|d["layerRoles"].append(dict(d["layerRoles"][0]))
deny|shape|sample|values の行のセルが列より少ない|d["tests"][0]["values"]["rows"][1]["cells"] = ["1"]
deny|shape|sample|values の columns が空(rows も空にして、セルの数の規則と切り離す)|d["tests"][0]["values"].update(columns=[], rows=[])
deny|shape|sample|Note の start が end より後|d["commitStories"][0]["notes"][0].update(start=3, end=2)
deny|shape|sample|Note の start が 0|d["commitStories"][0]["notes"][0]["start"] = 0
deny|shape|sample|excerpt の start が end より後|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 3, "end": 2}
deny|shape|sample|excerpt の start が 0|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 0, "end": 2}
deny|shape|sample|excerpt が 81 行|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 1, "end": 81}
deny|shape|sample|入力の excerpt に text を書く|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 1, "end": 2, "text": "one\ntwo"}
deny|shape|sample|feature の Target に id が無い|del d["overview"]["highlights"][0]["go"]["id"]
deny|shape|sample|layer の Target に layer が無い|del d["overview"]["highlights"][1]["go"]["layer"]
deny|shape|sample|file の Target に path が無い|del d["overview"]["highlights"][2]["go"]["path"]
deny|shape|sample|message の Target に id が無い|del d["overview"]["highlights"][3]["go"]["id"]
deny|shape|sample|flow の Target に id が無い|del d["overview"]["highlights"][4]["go"]["id"]
deny|shape|sample|feature の Target に file の path が混ざる|d["overview"]["highlights"][0]["go"]["path"] = "x"
deny|shape|sample|layer の Target に feature の id が混ざる|d["overview"]["highlights"][1]["go"]["id"] = "publish"
deny|shape|sample|file の Target に layer の layer が混ざる|d["overview"]["highlights"][2]["go"]["layer"] = "ハーネス"
deny|shape|sample|message の Target に file の path が混ざる|d["overview"]["highlights"][3]["go"]["path"] = "x"
deny|shape|sample|flow の Target に layer の layer が混ざる|d["overview"]["highlights"][4]["go"]["layer"] = "ハーネス"
deny|shape|sample|語彙の外の Target の kind|d["overview"]["highlights"][0]["go"]["kind"] = "module"
deny|shape|sample|todo が true でない(false)|d["tests"][1]["todo"] = False
deny|shape|sample|techniques に同じ観点を 2 回|d["tests"][0]["techniques"] = ["error", "error"]
deny|shape|sample|techniques が空|d["tests"][0]["techniques"] = []
deny|shape|sample|flow の steps が空|d["flows"][1]["steps"] = []
deny|shape|sample|Behavior に知らないキー|d["overview"]["after"][0]["k"] = "x"
deny|shape|sample|LayerRole に知らないキー|d["layerRoles"][0]["x"] = "y"
deny|shape|sample|Excerpt に知らないキー|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 1, "end": 2, "lang": "py"}
deny|shape|sample|concept の graph が真偽値でない|d["concepts"][3]["graph"] = "false"
deny|shape|sample|箱の名前(concept の name)が識別子|d["concepts"][0]["name"] = "TokenTemplate"
deny|shape|sample|やりとりの名前(message の name)が識別子|d["messages"][0]["name"] = "useTokenActions"
deny|shape|sample|機能の名前(feature の label)が識別子|d["features"][0]["label"] = "PrExplain"
deny|shape|sample|流れの名前(flow の label)が識別子|d["flows"][0]["label"] = "putExplain の流れ"
deny|shape|sample|suite の名前(suite の label)が識別子|d["suites"][0]["label"] = "buildPrExplain"
deny|shape|sample|見てほしい点の題(highlight の title)が識別子|d["overview"]["highlights"][0]["title"] = "addStop の規則"
deny|shape|sample|名前の識別子に日本語が空白なしで続く|d["concepts"][0]["name"] = "TokenTemplateの規則"
deny|shape|sample|名前の識別子をバッククォートで囲む|d["concepts"][0]["name"] = "`TokenTemplate`"
deny|shape|sample|名前に docs の語(publicProps)と docs に無い識別子が混ざる|d["concepts"][0]["name"] = "publicProps と TokenTemplate"
pass|-|sample|名前に docs が仕様の語として使う複合語(publicProps)は書ける|d["concepts"][0]["name"] = "publicProps 宣言"
pass|-|sample|名前に docs の 1 ファイル(03-schema.md)にしか出ない複合語(layoutMode)は書ける|d["concepts"][0]["name"] = "layoutMode の扱い"
pass|-|sample|コード(message の code)の識別子は検査しない|d["messages"][0]["code"] = "putExplain()"
pass|-|sample|名前の 1 語の識別子(Result)は検査しない|d["concepts"][0]["name"] = "Result の扱い"
pass|-|sample|名前に大文字だけの略語(UI 案・VRT)は書ける|d["concepts"][0]["name"] = "UI 案"; d["features"][0]["label"] = "VRT"
pass|-|sample|説明文(concept の role)の識別子は検査しない|d["concepts"][0]["role"] = "TokenTemplate を組み立てる"
pass|-|sample|テスト名(test の name)の識別子は検査しない|d["tests"][0]["name"] = "sortBy で並べ替えたとき順序が保たれる"
pass|-|sample|振る舞い(impact)の見本(任意のキーをすべて使う)は通る|assert set(d["impact"]) == {"title", "lead", "changed", "tables", "added", "kept"} and "note" in d["impact"]["tables"][0]["rowHeads"][1]
pass|-|sample|振る舞いが題と要約だけでも通る|d["impact"] = {"title": "題", "lead": "要約"}
pass|-|sample|状況の表の行と列で同じ id を使える(軸ごとに別の名前空間)|ids = {"mapped": "passing", "unmapped": "failing"}; t = d["impact"]["tables"][0]; [h.update(id=ids[h["id"]]) for h in t["columnHeads"]]; [o.update(columnHead=ids[o["columnHead"]]) for o in t["outcomes"]]
pass|-|sample|変わらないことのテストが未実装のものだけでも通る|d["impact"]["kept"][0]["tests"] = ["stale"]
pass|-|sample|変わったことのこれまでが 0 件でも通る|d["impact"]["changed"]["before"] = []
pass|-|sample|増えた状況のこれまでが 0 件でも通る|d["impact"]["added"][0]["before"] = []
pass|-|sample|振る舞いの文に docs が仕様の語として使う複合語(publicProps)は書ける|d["impact"]["title"] = "publicProps の宣言が画面に出るようになった"
pass|-|sample|変わったことの前後で一部の行が同じでも通る(変わらない行を文脈として並べる)|d["impact"]["changed"]["before"].append(dict(d["impact"]["changed"]["after"][0]))
deny|shape|sample|振る舞い(impact)が配列|d["impact"] = []
deny|shape|sample|振る舞いに知らないキー|d["impact"]["extra"] = 1
deny|shape|sample|振る舞いに題(title)が無い|del d["impact"]["title"]
deny|shape|sample|変わったことに before が無い|del d["impact"]["changed"]["before"]
deny|shape|sample|変わったことのこれからが空|d["impact"]["changed"]["after"] = []
deny|shape|sample|状況の表の rowHeads が空(outcomes も空にして、マスの揃いの規則と切り離す)|d["impact"]["tables"][0].update(rowHeads=[], outcomes=[])
deny|shape|sample|状況の表の columnHeads が空(outcomes も空にして、マスの揃いの規則と切り離す)|d["impact"]["tables"][0].update(columnHeads=[], outcomes=[])
deny|shape|sample|状況の表の rowHeads の id が重複|t = d["impact"]["tables"][0]; t["rowHeads"].append(dict(t["rowHeads"][0]))
deny|shape|sample|状況の表の columnHeads の id が重複|t = d["impact"]["tables"][0]; t["columnHeads"].append(dict(t["columnHeads"][1]))
deny|shape|sample|状況の表の組み合わせが欠けている(最後のマスを消す)|d["impact"]["tables"][0]["outcomes"].pop()
deny|shape|sample|状況の表に同じ組み合わせのマスが 2 つ|t = d["impact"]["tables"][0]; t["outcomes"].append(dict(t["outcomes"][3]))
deny|shape|sample|状況の表に rowHeads に無い行のマスを足す|d["impact"]["tables"][0]["outcomes"].append({"rowHead": "nope", "columnHead": "mapped", "result": "結果"})
deny|shape|sample|状況の表に columnHeads に無い列のマスを足す|d["impact"]["tables"][0]["outcomes"].append({"rowHead": "passing", "columnHead": "nope", "result": "結果"})
deny|shape|sample|マスのこれまで(was)が今の結果(result)と同じ|o = d["impact"]["tables"][0]["outcomes"][1]; o["was"] = o["result"]
deny|shape|sample|変わったことの前後がまったく同じ|c = d["impact"]["changed"]; c["before"] = [dict(line) for line in c["after"]]
deny|shape|sample|変わったことの前後で文の並びが同じなら、やりとり(message)だけが違っても落ちる|c = d["impact"]["changed"]; c["before"] = [{"text": line["text"]} for line in c["after"]]
deny|shape|sample|増えた状況の前後がまったく同じ|a = d["impact"]["added"][0]; a["before"] = [dict(line) for line in a["after"]]
deny|shape|sample|マスの tests に同じテストを 2 回|d["impact"]["tables"][0]["outcomes"][1]["tests"] = ["unknown-key", "unknown-key"]
deny|shape|sample|増えた状況の tests に同じテストを 2 回|d["impact"]["added"][0]["tests"] = ["stale", "stale"]
deny|shape|sample|変わらないことの tests に同じテストを 2 回|d["impact"]["kept"][0]["tests"] = ["unknown-key", "unknown-key"]
deny|shape|sample|増えた状況に before が無い|del d["impact"]["added"][0]["before"]
deny|shape|sample|増えた状況のこれからが空|d["impact"]["added"][0]["after"] = []
deny|shape|sample|列の見出しに注(note)を書く(注を持てるのは行の見出しだけ)|d["impact"]["tables"][0]["columnHeads"][0]["note"] = "注"
deny|shape|sample|振る舞いの要約(lead)にバッククォート|d["impact"]["lead"] = "`put-explain` で置くようになった"
deny|shape|sample|状況の表の題(label)が識別子|d["impact"]["tables"][0]["label"] = "putExplain の結果"
deny|shape|sample|マスの結果(result)が識別子|d["impact"]["tables"][0]["outcomes"][0]["result"] = "buildPrExplain が置く"
deny|shape|sample|変わらないことの文が識別子|d["impact"]["kept"][2]["text"] = "removePage で消える"
deny|meta|sample|pr が公開先と違う|d["pr"] = d["pr"] + 1
deny|ref|sample|message の from が concepts に無い|d["messages"][0]["from"] = "no/such"
deny|ref|sample|message の to が concepts に無い|d["messages"][0]["to"] = "no/such"
deny|ref|sample|flow の steps が messages に無い|d["flows"][0]["steps"] = ["nope"]
deny|ref|sample|commitStory の flows が flows に無い|d["commitStories"][0]["flows"] = ["nope"]
deny|ref|sample|commitStory の Behavior の message が messages に無い|d["commitStories"][0]["before"][0]["message"] = "nope"
deny|ref|sample|overview の Behavior の message が messages に無い|d["overview"]["after"][0]["message"] = "nope"
deny|ref|sample|test の suite が suites に無い|d["tests"][0]["suite"] = "nope"
deny|ref|sample|test の covers が messages に無い|d["tests"][0]["covers"] = ["nope"]
deny|ref|sample|test の targets が concepts に無い|d["tests"][0]["targets"] = ["no/such"]
deny|ref|sample|concept の feature が features に無い|d["concepts"][0]["feature"] = "nope"
deny|ref|sample|feature の Target が features に無い|d["overview"]["highlights"][0]["go"]["id"] = "nope"
deny|ref|sample|message の Target が messages に無い|d["overview"]["highlights"][3]["go"]["id"] = "nope"
deny|ref|sample|flow の Target が flows に無い|d["overview"]["highlights"][4]["go"]["id"] = "nope"
deny|ref|sample|todo のテストが commit を持つ|d["tests"][1]["commit"] = d["sha"]
deny|ref|sample|todo のテストが excerpt を持つ|d["tests"][1]["excerpt"] = {"path": "kept.txt", "start": 1, "end": 1}
deny|ref|sample|変わったことのこれまでの message が messages に無い|d["impact"]["changed"]["before"][0]["message"] = "nope"
deny|ref|sample|変わったことのこれからの message が messages に無い|d["impact"]["changed"]["after"][0]["message"] = "nope"
deny|ref|sample|マスの tests が tests に無い|d["impact"]["tables"][0]["outcomes"][1]["tests"] = ["nope"]
deny|ref|sample|増えた状況のこれまでの message が messages に無い|d["impact"]["added"][0]["before"][0]["message"] = "nope"
deny|ref|sample|増えた状況のこれからの message が messages に無い|d["impact"]["added"][0]["after"][0]["message"] = "nope"
deny|ref|sample|増えた状況の tests が tests に無い|d["impact"]["added"][0]["tests"] = ["nope"]
deny|ref|sample|変わらないことの tests が tests に無い|d["impact"]["kept"][1]["tests"] = ["nope"]
deny|code|sample|解説時点の sha がこのリポジトリに無い|d["sha"] = "f" * 40
deny|code|sample|抜粋のパスが解説時点の sha に無い|d["tests"][0]["excerpt"] = {"path": "missing.txt", "start": 1, "end": 1}
deny|code|sample|範囲の終わりがファイルの行数 + 1|d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 5, "end": 6}
CASES
)"

# 表の解説のファイルを 1 回の python でまとめて作る(`$work/case-<行番号>.json`)。ケースごとに
# 起動すると、この判定表の時間の半分が起動に消える。
printf '%s\n' "$cases" > "$work/cases.txt"
python3 - "$work" <<'PY'
import json, sys
work = sys.argv[1]
bases = {name: open(f"{work}/{name}.json", encoding="utf-8").read() for name in ("sample", "minimal")}
for number, line in enumerate(open(f"{work}/cases.txt", encoding="utf-8"), 1):
    fields = line.rstrip("\n").split("|", 4)
    if len(fields) < 5:
        continue
    d = json.loads(bases[fields[2]])
    raw = None
    exec(fields[4])
    open(f"{work}/case-{number}.json", "w", encoding="utf-8").write(raw if raw is not None else json.dumps(d, ensure_ascii=False))
PY

number=0
while IFS='|' read -r expected category base label change; do
  number=$((number + 1))
  [ -n "$label" ] || continue
  cp "$work/case-$number.json" "$work/case.json"
  report "$expected" "$(verdict "$category")" "$label"
done <<<"$cases"

# ここから下は書き出したものを見るケース。
# $1 解説のファイルを作る基準, $2 変形。検査を走らせ、終了コードを返す(書き出し先は `$work/out.json`)
# 残りの引数は検査の後ろへ足す
run_build() {
  local base="$1" change="$2"
  shift 2
  make_case "$base" "$change"
  rm -f "$work/out.json"
  python3 "$builder" "$work/case.json" --pr "$pr" --out "$work/out.json" "$@" >/dev/null 2>&1
}

# 書き出したものに対する Python の表明。`out` が書き出したもの、`given` が渡した解説。
# $1 表明。成り立てば pass
inspect_output() {
  [ -f "$work/out.json" ] || { echo unwritten; return; }
  python3 - "$work/case.json" "$work/out.json" "$1" <<'PY'
import json, sys
given = json.load(open(sys.argv[1], encoding="utf-8"))
out = json.load(open(sys.argv[2], encoding="utf-8"))
print("pass" if eval(sys.argv[3]) else "deny")
PY
}

with_excerpt='d["tests"][0]["excerpt"] = {"path": "kept.txt", "start": 2, "end": 3}'

run_build sample "" --repo "$repo"
report pass "$(inspect_output 'json.dumps(out, ensure_ascii=False) == json.dumps(given, ensure_ascii=False)')" "excerpt が無ければ、書き出すのは渡した解説と同じ JSON(キーの順も同じ)"

run_build sample "$with_excerpt" --repo "$repo"
report pass "$(inspect_output '"text" in out["tests"][0]["excerpt"] and json.dumps({**out, "tests": [{**out["tests"][0], "excerpt": {k: v for k, v in out["tests"][0]["excerpt"].items() if k != "text"}}, *out["tests"][1:]]}, ensure_ascii=False) == json.dumps(given, ensure_ascii=False)')" "足すのは excerpt の text だけ"
report pass "$(inspect_output 'out["tests"][0]["excerpt"]["text"] == "two\nthree"')" "text は作業ツリーではなく解説時点の sha の中身になる"

printf '{"before": true}\n' > "$work/out.json"
make_case sample 'd["version"] = 2'
python3 "$builder" "$work/case.json" --pr "$pr" --out "$work/out.json" --repo "$repo" >/dev/null 2>&1; status=$?
kept_out=deny
[ "$status" -eq 1 ] && [ "$(cat "$work/out.json")" = '{"before": true}' ] && kept_out=pass
report pass "$kept_out" "違反があれば終了コード 1 で、書き出し先のファイルを書き換えない"

run_build minimal "" --repo "$repo"; status=$?
written=deny
[ "$status" -eq 0 ] && [ "$(inspect_output 'out["version"] == 1')" = pass ] && written=pass
report pass "$written" "違反が無ければ終了コード 0 で、読める JSON を書き出す"

# パスはルートからなので、サブフォルダで走らせても同じファイルを読む(`--repo` を省くと今のフォルダ)。
make_case sample "$with_excerpt"
rm -f "$work/out.json"
(cd "$repo/sub" && python3 "$builder" "$work/case.json" --pr "$pr" --out "$work/out.json" >/dev/null 2>&1)
report pass "$(inspect_output 'out["tests"][0]["excerpt"]["text"] == "two\nthree"')" "サブフォルダで走らせても、ルートからのパスで同じ中身を読む"

run_build sample 'd["tests"][0]["excerpt"] = {"path": "noeol.txt", "start": 2, "end": 2}' --repo "$repo"
report pass "$(inspect_output 'out["tests"][0]["excerpt"]["text"] == "b"')" "末尾に改行の無いファイルの最終行まで入る"

make_case minimal ""
python3 "$builder" "$work/case.json" --pr "$pr" >/dev/null 2>&1; status=$?
bad_args=deny
[ "$status" -eq 2 ] && bad_args=pass
report pass "$bad_args" "書き出し先(--out)の無い呼び出しは引数の誤り"

# 振る舞い(impact)の型の文字列のキーは、どれも使う人の言葉(`user_text`)で書く。型を足したときに規則を付け忘れると、
# コードの名前がそのまま振る舞いの画面に出る。id のキーは文ではないので除く。
user_text_keys="$(python3 - "$builder" <<'PY'
import importlib.util, sys
spec = importlib.util.spec_from_file_location("build_pr_explain", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
inner = lambda field: field.value.item if isinstance(field.value, module.Many) else field.value
def shapes_under(name, seen):
    if name in seen:
        return seen
    nested = [inner(field).name for field in module.Shapes[name].values() if isinstance(inner(field), module.Shape)]
    for child in nested:
        seen = shapes_under(child, seen | {name})
    return seen | {name}
rules = [inner(field).rule for name in shapes_under("Impact", frozenset()) for field in module.Shapes[name].values() if isinstance(inner(field), module.Scalar)]
texts = [rule for rule in rules if rule != "id"]
print("pass" if texts and all(rule == "user_text" for rule in texts) else "deny")
PY
)"
report pass "$user_text_keys" "振る舞い(impact)の型の文字列のキーは、id を除いてどれも使う人の言葉(user_text)の規則を持つ"

exit "$cases_failed"
