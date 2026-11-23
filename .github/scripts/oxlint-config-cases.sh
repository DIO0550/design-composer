#!/usr/bin/env bash
#
# oxlint の設定(`.oxlintrc.json`)の判定表。ケースごとに 1 ファイルを置いて実物の oxlint で lint し、
# 規則ごとに deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/oxlint-config-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表を置くのは、設定の誤りが「黙って何も止めない」形で現れるから。** override の glob の写し忘れ・
# `plugins` の書き忘れ・オプションの形の誤りでも oxlint はエラーを出さず、`src` に違反が無い限り
# `pnpm run lint` は緑のまま残る。
#
# **ケースごとに `$work/c<番号>/` へ実物の設定を写してファイルを 1 つ置き、oxlint は `$work` で 1 回だけ
# 走らせる。** 入れ子の設定はその下のファイルにだけ効くので、1 回の出力をパスの頭でケースへ振り分けられる。
# ケースごとに起動すると、起動の時間がケースの数だけ積もる。
#
# 判定は、そのケースのファイルに `[Error/` の行があれば 1、無ければ 0 として、規則の名前の見出しと
# `decide` で突き合わせる。`[Error/` の有無はファイル単位で見るので、**1 ファイルで 1 規則だけを確かめる
# この表に限り、規則の診断が警告だけなら broken になる**(`error` を `warn` に下げる・`off` を外して警告が
# 出る、の退行を落とす)。
#
# その前に、oxlint の出力全体を同じ `decide` に掛ける。broken なら出力から規則ごとの判定ができないので、
# 終了コードと出力を 1 回だけ標準エラーへ出し、全ケースを broken にする。設定が壊れたとき(診断の行を
# 出さずに exit 1 で終わる)と oxlint が無いとき(exit 127)は、その一例。
#
# 表が見る規則は `no-restricted-imports` と jest の `no-restricted-jest-methods` / `no-hooks` と、
# `require-to-throw-message` の `off` だけ。`curly` / `max-depth` / `max-lines` / `react/forbid-elements` は
# 見ない。
#
# 表は `期待|規則|ケース名|置くパス|中身` の 1 行 1 ケース。規則は oxlint の unix 形式の出力で末尾の括弧に
# 入る名前。
# 置くパスに `{ext}` があれば `ts` `tsx` `mts` `cts` の 4 ケースに展開し、ケース名に ` (.mts)` などを付ける。
# 中身は `printf '%b'` で書く(`\n` が改行になる)。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | その規則の error として報告してほしい |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし。** 規則が見ない書き方(`pass` と分ける理由は `.claude/hooks/lib/cases-report.sh`
#            の `normalize_miss`) |
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
config="$repo_root/.oxlintrc.json"
oxlint_bin="$repo_root/node_modules/.bin/oxlint"
work="$(mktemp -d)" || exit 1
trap 'rm -rf "$work"' EXIT

source "$repo_root/.claude/hooks/lib/cases-report.sh"

extensions=(ts tsx mts cts)

# 展開したケースごとの期待・規則・ケース名・出力の行の頭(`c<番号>/<パス>:`)。
case_expected=()
case_rule=()
case_label=()
case_prefix=()

# 1 ケースを `$work/c<番号>/` に置き、展開したケースの配列に足す。
#
# $1 期待
# $2 規則
# $3 ケース名
# $4 置くパス(`{ext}` は展開済み)
# $5 中身
place_case() {
  local number=$((${#case_prefix[@]} + 1))
  local dir="$work/c$number"
  mkdir -p "$dir/$(dirname "$4")"
  cp "$config" "$dir/.oxlintrc.json"
  printf '%b\n' "$5" >"$dir/$4"
  case_expected+=("$1")
  case_rule+=("$2")
  case_label+=("$3")
  case_prefix+=("c$number/$4:")
}

cases="$(cat <<'CASES'
deny|no-restricted-imports|feature で useEffect を import すると止まる|src/features/probe/index.{ext}|import { useEffect } from "react";\nexport const probe = useEffect;
deny|no-restricted-imports|feature で useLayoutEffect を import すると止まる|src/features/probe/index.ts|import { useLayoutEffect } from "react";\nexport const probe = useLayoutEffect;
deny|no-restricted-imports|feature で useInsertionEffect を import すると止まる|src/features/probe/index.ts|import { useInsertionEffect } from "react";\nexport const probe = useInsertionEffect;
deny|no-restricted-imports|feature で React を default import すると止まる|src/features/probe/index.{ext}|import React from "react";\nexport const probe = React;
pass|no-restricted-imports|feature で useState は import できる|src/features/probe/index.ts|import { useState } from "react";\nexport const probe = useState;
deny|no-restricted-imports|components で useEffect を import すると止まる|src/components/probe/index.{ext}|import { useEffect } from "react";\nexport const probe = useEffect;
deny|no-restricted-imports|components で React を default import すると止まる|src/components/probe/index.tsx|import React from "react";\nexport const probe = React;
deny|no-restricted-imports|components で domains を import すると止まる|src/components/probe/index.{ext}|import { probe } from "@/domains/unit/probe";\nexport const p = probe;
deny|no-restricted-imports|許可していない hooks で useEffect を import すると止まる|src/hooks/use-probe/index.{ext}|import { useEffect } from "react";\nexport const probe = useEffect;
deny|no-restricted-imports|許可したモジュールのテストで useEffect を import すると止まる|src/hooks/use-subscription/__tests__/use-subscription.normal.test.{ext}|import { useEffect } from "react";\nexport const probe = useEffect;
deny|no-restricted-imports|use-subscription でも index.tsx なら useEffect は止まる|src/hooks/use-subscription/index.tsx|import { useEffect } from "react";\nexport const probe = useEffect;
pass|no-restricted-imports|use-subscription の index.ts は useEffect を import できる|src/hooks/use-subscription/index.ts|import { useEffect, useLayoutEffect } from "react";\nexport const probe = [useEffect, useLayoutEffect];
pass|no-restricted-imports|use-remeasure の index.ts は useEffect を import できる|src/hooks/use-remeasure/index.ts|import { useEffect, useLayoutEffect } from "react";\nexport const probe = [useEffect, useLayoutEffect];
deny|no-restricted-imports|use-subscription の index.ts でも domains は import できない|src/hooks/use-subscription/index.ts|import { probe } from "@/domains/unit/px";\nexport const p = probe;
deny|no-restricted-imports|hooks で domains を import すると止まる|src/hooks/use-probe/index.{ext}|import { probe } from "@/domains/unit/probe";\nexport const p = probe;
deny|no-restricted-imports|utils で domains を import すると止まる|src/utils/Probe.{ext}|import { probe } from "@/domains/unit/probe";\nexport const p = probe;
deny|no-restricted-imports|types で domains を import すると止まる|src/types/Probe.{ext}|import type { Probe } from "@/domains/unit/probe";\nexport type P = Probe;
deny|no-restricted-imports|libs で useEffect を import すると止まる|src/libs/probe/index.{ext}|import { useEffect } from "react";\nexport const probe = useEffect;
deny|no-restricted-imports|libs で React を default import すると止まる|src/libs/probe/index.ts|import React from "react";\nexport const probe = React;
deny|no-restricted-imports|libs で services を import すると止まる|src/libs/probe/index.{ext}|import { probe } from "@/services/probe";\nexport const p = probe;
deny|no-restricted-imports|domains で libs を import すると止まる|src/domains/session/probe/index.{ext}|import { probe } from "@/libs/probe";\nexport const p = probe;
pass|no-restricted-imports|domains のテストは libs を import できる|src/domains/session/probe/__tests__/probe.normal.test.{ext}|import { probe } from "@/libs/probe";\nexport const p = probe;
deny|no-restricted-imports|domains のテストで services を import すると止まる|src/domains/session/probe/__tests__/probe.normal.test.{ext}|import { probe } from "@/services/probe";\nexport const p = probe;
deny|no-restricted-imports|unit で dcmp を import すると止まる|src/domains/unit/probe/index.{ext}|import { probe } from "@/domains/dcmp/probe";\nexport const p = probe;
deny|no-restricted-imports|unit のテストで dcmp を import すると止まる|src/domains/unit/probe/__tests__/probe.normal.test.{ext}|import { probe } from "@/domains/dcmp/probe";\nexport const p = probe;
pass|no-restricted-imports|dcmp は unit を import できる|src/domains/dcmp/probe/index.{ext}|import { probe } from "@/domains/unit/probe";\nexport const p = probe;
deny|no-restricted-imports|dcmp で compiled を import すると止まる|src/domains/dcmp/probe/index.{ext}|import { probe } from "@/domains/compiled/probe";\nexport const p = probe;
deny|no-restricted-imports|dcmp のテストで compiled を import すると止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.{ext}|import { probe } from "@/domains/compiled/probe";\nexport const p = probe;
deny|no-restricted-imports|compiled で session を import すると止まる|src/domains/compiled/probe/index.{ext}|import { probe } from "@/domains/session/probe";\nexport const p = probe;
deny|no-restricted-imports|compiled のテストで session を import すると止まる|src/domains/compiled/probe/__tests__/probe.normal.test.{ext}|import { probe } from "@/domains/session/probe";\nexport const p = probe;
deny|no-restricted-imports|services で features を import すると止まる|src/services/probe/index.{ext}|import { probe } from "@/features/probe";\nexport const p = probe;
deny|no-restricted-jest-methods|feature のテストで vi.mock を使うと止まる|src/features/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|feature のテストで vi.doMock を使うと止まる|src/features/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.doMock("./m");
deny|no-restricted-jest-methods|libs のテストでも vi.mock は止まる|src/libs/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|vi の別名 vitest で vi.mock を呼んでも止まる|src/features/probe/__tests__/probe.normal.test.ts|import { vitest } from "vitest";\nvitest.mock("./m");
deny|no-restricted-jest-methods|テストの土台 src/test-setup.ts で vi.mock を使うと止まる|src/test-setup.ts|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|domains のテストで vi.mock を使うと止まる|src/domains/unit/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|domains のテストで vi.doMock を使うと止まる|src/domains/unit/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.doMock("./m");
deny|no-restricted-jest-methods|services のテストで vi.mock を使うと止まる|src/services/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|feature の domains のテストで vi.mock を使うと止まる|src/features/probe/domains/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.mock("./m");
deny|no-restricted-jest-methods|domains のテストで vi.fn を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nexport const f = vi.fn();
deny|no-restricted-jest-methods|domains の共有フィクスチャで vi.fn を使うと止まる|src/domains/__tests__/probe.ts|import { vi } from "vitest";\nexport const f = vi.fn();
deny|no-restricted-jest-methods|services のテストで vi.fn を使うと止まる|src/services/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nexport const f = vi.fn();
deny|no-restricted-jest-methods|feature の domains のテストで vi.fn を使うと止まる|src/features/probe/domains/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nexport const f = vi.fn();
deny|no-restricted-jest-methods|子 feature の domains のテストで vi.fn を使うと止まる|src/features/probe/features/child/domains/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nexport const f = vi.fn();
deny|no-restricted-jest-methods|domains のテストで vi.spyOn を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nexport const f = vi.spyOn(Math, "max");
deny|no-restricted-jest-methods|domains のテストで vi.stubGlobal を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.stubGlobal("probe", 1);
deny|no-restricted-jest-methods|domains のテストで vi.stubEnv を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.stubEnv("PROBE", "1");
deny|no-restricted-jest-methods|domains のテストで vi.importMock を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nexport const m = vi.importMock("./m");
deny|no-restricted-jest-methods|domains のテストで vi.mockObject を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nexport const m = vi.mockObject({});
deny|no-restricted-jest-methods|domains のテストで vi.useFakeTimers を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.useFakeTimers();
deny|no-restricted-jest-methods|domains のテストで vi.setSystemTime を使うと止まる|src/domains/dcmp/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.setSystemTime(0);
pass|no-restricted-jest-methods|feature のテストでは vi.fn を使える|src/features/probe/__tests__/probe.normal.test.{ext}|import { vi } from "vitest";\nexport const f = vi.fn();
pass|no-restricted-jest-methods|hooks のテストでは vi.fn を使える|src/hooks/use-probe/__tests__/use-probe.normal.test.ts|import { vi } from "vitest";\nexport const f = vi.fn();
pass|no-restricted-jest-methods|feature のテストではフェイクタイマーで時刻を差し替えられる|src/features/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nvi.useFakeTimers();\nvi.setSystemTime(0);
miss|no-restricted-jest-methods|名前空間で import した vi の mock は見ない|src/features/probe/__tests__/probe.normal.test.ts|import * as V from "vitest";\nV.vi.mock("./m");
miss|no-restricted-jest-methods|分割代入で取り出した mock は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { vi } from "vitest";\nconst { mock } = vi;\nmock("./m");
deny|no-hooks|テストで beforeEach を使うと止まる|src/features/probe/__tests__/probe.normal.test.{ext}|import { beforeEach } from "vitest";\nbeforeEach(() => {});
deny|no-hooks|テストで beforeAll を使うと止まる|src/features/probe/__tests__/probe.normal.test.ts|import { beforeAll } from "vitest";\nbeforeAll(() => {});
deny|no-hooks|テストで afterAll を使うと止まる|src/features/probe/__tests__/probe.normal.test.ts|import { afterAll } from "vitest";\nafterAll(() => {});
deny|no-hooks|別名で import した beforeEach も止まる|src/features/probe/__tests__/probe.normal.test.ts|import { beforeEach as setup } from "vitest";\nsetup(() => {});
deny|no-hooks|domains のテストで beforeEach を使うと止まる|src/domains/unit/probe/__tests__/probe.normal.test.ts|import { beforeEach } from "vitest";\nbeforeEach(() => {});
deny|no-hooks|テストの土台 src/test-setup.ts で beforeEach を使うと止まる|src/test-setup.ts|import { beforeEach } from "vitest";\nbeforeEach(() => {});
pass|no-hooks|テストで afterEach は使える|src/features/probe/__tests__/probe.normal.test.{ext}|import { afterEach } from "vitest";\nafterEach(() => {});
pass|no-hooks|テストの土台 src/test-setup.ts で afterEach は使える|src/test-setup.ts|import { afterEach } from "vitest";\nafterEach(() => {});
pass|no-hooks|テストの中の onTestFinished は使える|src/features/probe/__tests__/probe.normal.test.ts|import { expect, onTestFinished, test } from "vitest";\ntest("probe", () => {\n  onTestFinished(() => {});\n  expect(1).toBe(1);\n});
miss|no-hooks|aroundEach は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { aroundEach } from "vitest";\naroundEach(async (run) => {\n  await run();\n});
miss|no-hooks|aroundAll は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { aroundAll } from "vitest";\naroundAll(async (run) => {\n  await run();\n});
miss|no-hooks|名前空間で import した beforeEach は見ない|src/features/probe/__tests__/probe.normal.test.ts|import * as V from "vitest";\nV.beforeEach(() => {});
miss|no-hooks|test.beforeEach は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { test } from "vitest";\ntest.beforeEach(() => {});
miss|no-hooks|it.beforeAll は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { it } from "vitest";\nit.beforeAll(() => {});
miss|no-hooks|test.extend で作ったテストの beforeEach は見ない|src/features/probe/__tests__/probe.normal.test.ts|import { test } from "vitest";\ntest.extend({}).beforeEach(() => {});
pass|require-to-throw-message|toThrow にメッセージを渡さなくてもよい|src/features/probe/__tests__/probe.normal.test.ts|import { expect, test } from "vitest";\ntest("probe", () => {\n  expect(() => JSON.parse("{")).toThrow();\n});
CASES
)"

while IFS='|' read -r expected rule label path body; do
  [ -n "$label" ] || continue
  if [[ "$path" != *"{ext}"* ]]; then
    place_case "$expected" "$rule" "$label" "$path" "$body"
    continue
  fi
  for ext in "${extensions[@]}"; do
    place_case "$expected" "$rule" "$label (.$ext)" "${path//\{ext\}/$ext}" "$body"
  done
done <<<"$cases"

# oxlint の unix 形式の出力で、error の診断の行に当たる正規表現。
error_line='\[Error/'

output="$(cd "$work" && "$oxlint_bin" -f unix . 2>&1)"
status=$?

output_unjudgeable=""
if [ "$(decide "$output" "$status" "$error_line")" = "broken" ]; then
  output_unjudgeable=1
  printf 'oxlint の出力から判定できない(終了コード %s)。出力:\n%s\n' "$status" "$output" >&2
fi

cases_before=$cases_reported
for index in "${!case_prefix[@]}"; do
  if [ -n "$output_unjudgeable" ]; then
    report "${case_expected[$index]}" broken "${case_label[$index]}"
    continue
  fi
  lines="$(awk -v p="${case_prefix[$index]}" 'index($0, p) == 1' <<<"$output")"
  has_error=0
  grep -qE "$error_line" <<<"$lines" && has_error=1
  decision="$(decide "$lines" "$has_error" "\\(${case_rule[$index]}\\)\\]\$")"
  report "${case_expected[$index]}" "$(normalize_miss "${case_expected[$index]}" "$decision")" "${case_label[$index]}"
done
report_cases_ran cases "$cases_before"

exit "$cases_failed"
