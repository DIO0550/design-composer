# harness/githooks — 実行環境に依存しない push 前検査

git ネイティブのフック置き場。`core.hooksPath` をここへ向けると、CLI・IDE・素の git の
どれから push しても同じ検査が走る。

## 配線

`pnpm install` が `package.json` の `prepare` から [`set-hooks-path.sh`](set-hooks-path.sh) を呼び、
`core.hooksPath` をここへ向ける。**クローン直後に手で実行するものは無い。**

```bash
# 配線されているかの確認
git config --get core.hooksPath   # → harness/githooks
```

DevContainer の `postCreateCommand`（`.devcontainer/devcontainer.json`）にも同じ設定が
残っている。`pnpm install` より前に配線されるので消していないが、配線の担当は `prepare`。

**手で 1 度実行する形をやめたのは、実行し忘れた環境が実際に穴になっていたため。**
リモート実行環境（Claude Code on the web など）は毎回クローンからやり直すうえ、
DevContainer の `postCreateCommand` も走らない。そこは Claude Code のフックが
読まれないことがある環境と同じなので、**2 層が同時に抜けて CI だけが残る**状態になっていた。

## 何が走るか

| フック | 検査 | 呼んでいるもの |
| --- | --- | --- |
| `pre-push` | 型 / lint / format / doc コメント / テスト規約 / import 規約 / 判別子の直読み / 追加された lint 抑制 / 追加されたテストヘルパーの重複 / 行数のラチェット / 集計の判定表 | `pnpm run typecheck`・`pnpm run lint`・`pnpm exec biome check`・`.claude/hooks/lib/missing-doc-comments.py`・`.claude/hooks/lib/test-rules-scan.sh`・`.claude/hooks/lib/import-rule-violations.py`・`.claude/hooks/lib/result-option-read-violations.py`・`.github/scripts/check-added-lint-suppressions.sh`・`.github/scripts/check-added-test-helper-duplication.sh`・`harness/records/count.sh --ratchet`・`harness/records/count-cases.sh` |

| スクリプト | 呼ばれ方 | 内容 |
| --- | --- | --- |
| `set-hooks-path.sh` | `package.json` の `prepare`（`pnpm install`） | `core.hooksPath` をここへ向ける。git の無い環境・git リポジトリでない場所では黙って飛ばす |

**検査そのものは `.claude/hooks/lib/` と共有している。** Claude Code のフックはこれと
同じスクリプトを走らせる即時フィードバック版で、内容が二重管理にならないようにしている。
`check-added-*` の 2 つだけは `.github/scripts/` にあり、CI と同じスクリプトをそのまま呼ぶ
(base との差分で判定するので、判定を `lib/` へ移しても呼び出し側は同じになる)。
**行数のラチェットと集計の判定表**(`harness/records/count.sh --ratchet` /
`harness/records/count-cases.sh`)も `.claude/hooks/` 側に対応物を持たない。ここと CI の
両方へ置くので、層 3 を足しても守る範囲が増えないため。

道具の揃っていない環境では、その道具を使う検査だけを飛ばす。`pnpm` または
`node_modules` が無ければ型 / lint / format を、`python3` が無ければ doc コメント /
import 規約 / 判別子の直読みを飛ばす（残りは bash だけで走る）。既存の `pre-push-*` と
同じ扱いで、検査できないことを理由に push を止めても検査の質は上がらないため。

**`python3` が無い環境では、`check-added-*` の 2 つは飛ばずに走り、何も見ずに 0 件として
通る**（検出器の呼び出しが `|| true` のため。実測）。飛ばした検査は出力に「飛ばします」が
残るが、こちらは通常の「ありません」が出るので、**通ったことが検査された証拠にならない**。

## なぜ git 側にも置くのか

**Claude Code のフックは発火しない実行環境がある。** リモート実行環境（Claude Code on the
web など）では `.claude/settings.json` の配線が読み込まれないことがあり、しかも
**フェイルオープンかつサイレント**なので、通ったのか検査されなかったのかが区別できない
（PR #168 では `pre-push-lint.sh` 単体は正しく deny を返すのに push が通り、CI で落ちた）。

強制力の序列は次のとおり。詳細と、CI でも git でも代替できない制約の一覧は
[`.claude/hooks/README.md`](../../.claude/hooks/README.md)。

| # | 層 | 効く範囲 | タイミング |
| --- | --- | --- | --- |
| 1 | CI | 無条件 | push の後 |
| 2 | git hooks（ここ） | クライアント非依存 | push の前 |
| 3 | Claude Code hooks | CLI 起動セッションのみ | 編集・コマンドの直前 |
| 4 | skill / rules | お願いベース | 読まれたとき |

## 動作確認

```bash
bash harness/githooks/pre-push
```

`core.hooksPath` を設定したうえで push すると、失敗した検査の出力がそのまま出て
push が中止される。
