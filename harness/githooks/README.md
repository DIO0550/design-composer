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
| `pre-push` | 型 / lint / format / doc コメント / テスト規約 / import 規約 / 判別子の直読み / story の title / 名指ししたパス / 判別子の直読みの判定表 / story の title の判定表 / 名指ししたパスの判定表 / doc コメントの判定表 / 追加された lint 抑制 / 追加されたテストヘルパーの重複 / 追加された宣言の doc コメント / 追加された分の検査の判定表 / 行数のラチェット / 集計の判定表 / カナリアの判定表 | `pnpm run typecheck`・`pnpm run lint`・`pnpm exec biome check`・`.claude/hooks/lib/missing-doc-comments.py`・`.claude/hooks/lib/test-rules-scan.sh`・`.claude/hooks/lib/import-rule-violations.py`・`.claude/hooks/lib/result-option-read-violations.py`・`.claude/hooks/lib/story-title-violations.py`・`.claude/hooks/lib/named-path-violations.py`・`.claude/hooks/lib/result-option-read-cases.sh`・`.claude/hooks/lib/story-title-cases.sh`・`.claude/hooks/lib/named-path-cases.sh`・`.claude/hooks/lib/missing-doc-comments-cases.sh`・`.github/scripts/check-added-lint-suppressions.sh`・`.github/scripts/check-added-test-helper-duplication.sh`・`.github/scripts/check-added-doc-comments.sh`・`.github/scripts/check-added-cases.sh`・`harness/records/count.sh --ratchet`・`harness/records/count-cases.sh`・`.claude/hooks/lib/canary-cases.sh` |

| スクリプト | 呼ばれ方 | 内容 |
| --- | --- | --- |
| `set-hooks-path.sh` | `package.json` の `prepare`（`pnpm install`） | `core.hooksPath` をここへ向ける。git の無い環境・git リポジトリでない場所では黙って飛ばす |

**検査そのものは `.claude/hooks/lib/` と共有している。** Claude Code のフックはこれと
同じスクリプトを走らせる即時フィードバック版で、内容が二重管理にならないようにしている。
`check-added-*` の 3 つだけは `.github/scripts/` にあり、CI と同じスクリプトをそのまま呼ぶ
(base との差分で判定するので、判定を `lib/` へ移しても呼び出し側は同じになる)。
[その判定表](../../.github/scripts/check-added-cases.sh)と、3 つが共有する前提チェック
(`.github/scripts/lib/detector-precondition.sh`)も同じ場所に置く。`.claude/hooks/lib/` は
**検査そのもの**の共有場所なので、当てる先と一緒にしておく。
**行数のラチェットと判定表 6 本**(`harness/records/count.sh --ratchet` /
`harness/records/count-cases.sh` / `.claude/hooks/lib/result-option-read-cases.sh` /
`.claude/hooks/lib/story-title-cases.sh` / `.claude/hooks/lib/named-path-cases.sh` /
`.claude/hooks/lib/missing-doc-comments-cases.sh` / `.claude/hooks/lib/canary-cases.sh`)も
`.claude/hooks/` 側のフック(`pre-push-*.sh`)に対応物を持たない。判定表をどの層へ置くかと、層 3 へ足さない理由は
`.claude/hooks/README.md`「カバー範囲と残る穴」。

**道具が無い環境では、その道具を使う検査だけを飛ばす。** 既存の `pre-push-*` と同じ扱いで、
検査できないことを理由に push を止めても検査の質は上がらないため。飛ばす単位は 3 つある。

| 無いもの | 飛ぶ検査 |
| --- | --- |
| `pnpm` または `node_modules` | 型 / lint / format |
| `python3`（起動できないものが PATH に居る場合を含む） | doc コメント（と判定表） / import 規約 / 判別子の直読み（と判定表） / story の title（と判定表） / 名指ししたパス（と判定表） / 追加された lint 抑制 / 追加されたテストヘルパーの重複 / 追加された宣言の doc コメント / 追加された分の検査の判定表 |
| `python3`（同上）または `jq` | カナリアの判定表 |

**どちらも飛ばしたことを出力に「飛ばします」と残す。** 通常の成功と綴りが同じだと、
通ったことが検査された証拠にならないため。`check-added-*` は以前この形で、`python3` が
無い環境でも飛ばずに走り、何も見ずに「ありません」と出して通っていた（検出器の呼び出しが
`|| true` で、検出器が走らなくても出力が空になるため）。いまは
[`lib/detector-precondition.sh`](../../.github/scripts/lib/detector-precondition.sh) が
その場合に exit 2 を返すので、**層 1（CI）は落ちる**。層 2 はそれを受け取らず、上の表の
とおり呼ぶ前に飛ばす（止めない方針のため）。

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

# python3 が使えない環境で、飛ばしたことが出力に残るか。
# 起動すると 127 で落ちる python3 を PATH の先頭へ置いて走らせる
dir="$(mktemp -d)"
printf '#!/usr/bin/env bash\nexit 127\n' >"$dir/python3" && chmod +x "$dir/python3"
PATH="$dir:$PATH" bash harness/githooks/pre-push; echo "exit=$?"   # 飛ばして exit 0
```

`core.hooksPath` を設定したうえで push すると、失敗した検査の出力がそのまま出て
push が中止される。
