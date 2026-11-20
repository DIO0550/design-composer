# harness/githooks — 実行環境に依存しない push 前検査

git ネイティブのフック置き場。`core.hooksPath` をここへ向けると、CLI・IDE・素の git のどれから push しても同じ検査が走る。

## 配線

`pnpm install` が `package.json` の `prepare` から [`set-hooks-path.sh`](set-hooks-path.sh) を呼び、`core.hooksPath` をここへ向ける。**クローン直後に手で実行する作業はない。**

```bash
# 配線されているかの確認
git config --get core.hooksPath   # → harness/githooks
```

DevContainer の `postCreateCommand`（`.devcontainer/devcontainer.json`）にも同じ設定が残っている。`pnpm install` より前に配線されるため消していないが、配線の担当は `prepare`。

**手で 1 度実行する形をやめたのは、実行し忘れた環境が実際に穴になっていたため。** リモート実行環境（Claude Code on the web など）は毎回クローンからやり直すうえ DevContainer の `postCreateCommand` も走らず、Claude Code のフックが読まれない環境とも重なっていたため、**2 層が同時に抜けて CI だけが残る**状態になっていた。

## 何が走るか

### `pre-push` が呼ぶ検査一覧（計 34 本）

| カテゴリ | 検査 | 呼んでいるもの |
| --- | --- | --- |
| 型・lint・規約検査（9 本） | 型 / lint / format / doc コメント / テスト規約 / import 規約 / story の title / 名指ししたパス / テストヘルパーの重複 | `pnpm run typecheck`・`pnpm run lint`・`pnpm exec biome check`・`.claude/hooks/lib/missing-doc-comments.py`・`.claude/hooks/lib/test-rules-scan.sh`・`.claude/hooks/lib/import-rule-violations.py`・`.claude/hooks/lib/story-title-violations.py`・`.claude/hooks/lib/named-path-violations.py`・`.claude/hooks/lib/duplicate-test-helpers.py --all src` |
| 差分ベース検査と判定表（3 本） | 追加された lint 抑制 / 追加されたテストヘルパーの重複 / 追加分の検査の判定表 | `.github/scripts/check-added-lint-suppressions.sh`・`.github/scripts/check-added-test-helper-duplication.sh`・`.github/scripts/check-added-cases.sh` |
| 検出器・フックの判定表（12 本） | import 規約 / story の title / 名指ししたパス / doc コメント / テストヘルパーの重複 / Issue の作業の種類 / カナリア / push 前検査フック / 編集時検査フック / 作業ツリーを書き換えるサブエージェントの実行中フラグ / 親セッションの編集 / 判定の読み取り・報告・種別照合 | `.claude/hooks/lib/import-rule-cases.sh`・`.claude/hooks/lib/story-title-cases.sh`・`.claude/hooks/lib/named-path-cases.sh`・`.claude/hooks/lib/missing-doc-comments-cases.sh`・`.claude/hooks/lib/duplicate-test-helpers-cases.sh`・`.claude/hooks/lib/issue-flow-kind-cases.sh`・`.claude/hooks/lib/canary-cases.sh`・`.claude/hooks/lib/pre-push-detector-cases.sh`・`.claude/hooks/lib/edit-detector-cases.sh`・`.claude/hooks/lib/verification-agent-cases.sh`・`.claude/hooks/lib/parent-session-edit-cases.sh`・`.claude/hooks/lib/cases-report-cases.sh` |
| PR 解説ページの判定表（5 本） | 変更の地図 / 解説ページの置き場 / 解説の検査 / 解説ページの枠の検査 / 解説ページの核 | `.github/scripts/build-pr-change-map-cases.sh`・`.github/scripts/pr-explain-pages-cases.sh`・`.github/scripts/build-pr-explain-cases.sh`・`.github/scripts/check-pr-explain-template-cases.sh`・`.github/scripts/pr-explain-core-cases.sh` |
| PR 運用・記録・集計（5 本） | 行数のラチェット / 集計の判定表 / sticky コメントの投稿・差し替えの判定表 / PR が閉じる Issue の検査の判定表 / `pre-push` の結果行の判定表 | `harness/records/count.sh --ratchet`・`harness/records/count-cases.sh`・`.github/scripts/upsert-sticky-comment-cases.sh`・`.github/scripts/check-pr-closing-issue-cases.sh`・`harness/githooks/lib/check-tally-cases.sh` |

### このディレクトリの補助スクリプト

| スクリプト | 呼ばれ方 | 内容 |
| --- | --- | --- |
| `set-hooks-path.sh` | `package.json` の `prepare`（`pnpm install`） | `core.hooksPath` をここへ向ける。git のない環境や git リポジトリ外では黙って飛ばす |
| `lib/check-tally.sh` | `pre-push` が source する | 検査が落ちても止めずに最後まで走らせ、通過・失敗・飛ばしを数えて最後の行に結果を出す（下の「結果の読み方」） |
| `lib/check-tally-cases.sh` | `pre-push` / `frontend.yml` の `rules-check` | `lib/check-tally.sh` の判定表。実物の検査の代わりにスタブを流し、終了コードと最後の行を確認する。加えて `.claude/hooks/lib/cases-report-cases.sh` の最後の文が `exit "$cases_failed"` であることと、本物のルートで判定表の最後の文を確かめる呼び出しを持つことを確認する |

### 検査スクリプトの置き場所と共有

- **検査本体は `.claude/hooks/lib/` と共有する。** Claude Code のフックは同じスクリプトを走らせる即時フィードバック版とし、二重管理を避ける
- **`check-added-*` の 2 本とその共有部品は `.github/scripts/` に置く。** base との差分で判定する CI と同じスクリプトをそのまま呼ぶ。[その判定表](../../.github/scripts/check-added-cases.sh)と共有ライブラリ（前提チェックの `.github/scripts/lib/detector-precondition.sh`、異常終了を判別する `.github/scripts/lib/detector-report.sh`、追加行番号を取り出す `.github/scripts/lib/added-lines.sh`）も同じ場所に置く。前提チェックと異常終了判別は層 3 の `.claude/hooks/lib/pre-push-detector.sh` と `.claude/hooks/lib/edit-detector.sh` からも参照し、層ごとの判定のぶれを防ぐ
- **PR 解説ページの判定表 5 本も `.github/scripts/` に置く。** 対象が `pr-explain.yml`・`pr-explain-list.yml` と `pr-explain` スキルから呼ばれるスクリプトと同じ場所にあるため
- **行数のラチェット（`count.sh --ratchet`）と判定表（上の表の各 `*-cases.sh` 計 22 本）は、`.claude/hooks/` 側の `pre-push-*.sh` に対応物を持たない。** 判定表をどの層へ置くかと層 3 へ足さない理由は `.claude/hooks/README.md`「カバー範囲と残る穴」を参照

### 道具がない環境でのスキップ条件

**道具がない環境では、その道具を使う検査だけを飛ばす。** 既存の `pre-push-*` と同じく、検査できないことを理由に push を止めても検査の質は上がらないため。飛ばす単位は 5 つ。

| ないもの | 飛ぶ検査 |
| --- | --- |
| `pnpm` または `node_modules` | 型 / lint / format |
| `python3`（起動できないものが PATH にある場合を含む） | doc コメント（と判定表） / import 規約（と判定表） / story の title（と判定表） / 名指ししたパス（と判定表） / テストヘルパーの重複（と判定表） / Issue の作業の種類の判定表 / 追加された lint 抑制 / 追加されたテストヘルパーの重複 / 追加分の検査の判定表 / 変更の地図・解説ページの置き場・解説の検査・解説ページの枠の検査の判定表 |
| `python3`（同上）または `jq` | カナリアの判定表 / push 前検査フックの判定表 / 編集時検査フックの判定表 |
| `jq` | sticky コメントの投稿・差し替えの判定表 / PR が閉じる Issue の検査の判定表 |
| `python3`（同上）または `node`（起動できないもの・Node 20 未満が PATH にある場合を含む） | 解説ページの核の判定表 |

**飛ばしたことを出力に「飛ばします」と残し、最後の行の件数にも数える。** 通常の成功と同じ出力だと、検査が本当に走った証拠にならないため。

- 以前、`check-added-*` は `python3` がない環境でも飛ばずに走り、`|| true` のため出力が空のまま「ありません」として通っていた。現在は [`lib/detector-precondition.sh`](../../.github/scripts/lib/detector-precondition.sh) が exit 2 を返すため**層 1（CI）は落ちる**。層 2 は上の表のとおり呼ぶ前に飛ばす（止めない方針のため）
- 検出器が起動後に途中で落ちた場合も同様に出力が空になるが、こちらは検出器側の欠陥なので [`lib/detector-report.sh`](../../.github/scripts/lib/detector-report.sh) が見分けて exit 2 を返し、**層 1・層 2 とも落ちる**（層 3 の `deny_on_violations` も deny する。編集時フック 3 本は止めずに「検査できていません」を伝える）

## 結果の読み方

**最後の行が結果を言う。** 落ちた検査があっても止めずに最後まで走らせ、最後に内訳と結果を出す。

```
pre-push: 失敗した検査: typecheck
pre-push: 飛ばした検査: カナリアの判定表
pre-push: 結果 失敗(失敗 1 / 通過 18 / 飛ばした 1)
```

| 最後の行 | 終了コード | 意味 |
| --- | --- | --- |
| `pre-push: 結果 すべて通過(…)` | 0 | すべて走って、すべて通った |
| `pre-push: 結果 飛ばした検査があるまま通過(…)` | 0 | 走ったものは通ったが、道具がなくて走らせていないものがある |
| `pre-push: 結果 失敗(…)` | 1 | 落ちた検査がある（exit 2 の「検査できなかった」を含む） |

- **止めずに最後まで走らせるのは、結果を最後の 1 行で明示するため。** 以前は `set -e` で最初の失敗で止まり、通ったときの最後の行はカナリアの判定表の `ok` だった。「落ちた証拠が見当たらない」ことから推測するしかなく、途中の出力を読み落とすと誤判定する（PR #168 は連ねた検査の末尾だけを見て通ったと判断し CI で落ちた）
- **`PRE_PUSH_REQUIRE_ALL=1` のときは、飛ばした検査も失敗に数える**（最後の行は `失敗(… 。PRE_PUSH_REQUIRE_ALL=1 のため飛ばした検査も失敗に数える)`）。push 前手順（`implementation-flow` フェーズ 7）はこのモードで走らせ、「すべて確かめた」を終了コードだけで判定する。引数にしないのは、git が `pre-push` へリモート名と URL を位置引数で渡すため

## なぜ git 側にも置くのか

リモート実行環境（Claude Code on the web など）では `.claude/settings.json` の配線が読み込まれないことがあり、しかも**フェイルオープンかつサイレント**なため、通ったのか検査されなかったのかを区別できない（PR #168）。クライアントに依存せず push 前に確実に走らせる層 2 として、git フックをここに置く。

強制力の序列（層 1 CI → 層 2 git hooks → 層 3 Claude Code hooks → 層 4 skill / rules）の詳細と、CI でも git でも代替できない制約の一覧は [`.claude/hooks/README.md`](../../.claude/hooks/README.md)「強制力の序列」を参照。

## 動作確認

```bash
bash harness/githooks/pre-push; echo "exit=$?"   # 最後の行が「すべて通過」・exit=0

# python3 が使えない環境で、飛ばしたことが出力に残るか。
# 起動すると 127 で落ちる python3 を PATH の先頭へ置いて走らせる
dir="$(mktemp -d)"
printf '#!/usr/bin/env bash\nexit 127\n' >"$dir/python3" && chmod +x "$dir/python3"
PATH="$dir:$PATH" bash harness/githooks/pre-push; echo "exit=$?"                          # 「飛ばした検査があるまま通過」・exit=0
PRE_PUSH_REQUIRE_ALL=1 PATH="$dir:$PATH" bash harness/githooks/pre-push; echo "exit=$?"   # 「失敗」・exit=1

# 集計そのものの判定表
bash harness/githooks/lib/check-tally-cases.sh; echo "exit=$?"
```

落ちた検査があっても最後まで走り結果の行が失敗を示すことの確認は、違反の probe を置いて行う（レシピは `.claude/hooks/README.md`「動作確認」の「層 2（git hooks）が落ちた検査のあとも最後まで走り」のブロック）。実在しない probe のパスを書いてよいのは `named-path-violations.py` が免除しているあちらのフェンス内だけなので、ここにはパスを書かない。

`core.hooksPath` を設定したうえで push すると、落ちた検査があれば最後まで走ったあとに結果の行を出して push が中止される。
