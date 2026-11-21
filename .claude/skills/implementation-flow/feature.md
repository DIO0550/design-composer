# `flow:feature`: 仕様を落ちるテストで固定してから実現する

`flow:feature` の Issue で、`SKILL.md` の各フェーズに**追加する**手順。記載のないフェーズは `SKILL.md` のままとする。

**実装より先に、assert で落ちるテストと骨組みを書いてコミットする。** 実装と同時に書いたテストは、実装に合わせて書かれていないかを確かめられない。`test-reviewer` が示すのは判断ごとに落ちるかであり、テストが仕様から先に書かれたかではない。

## フェーズ 3: 計画に足すもの

- **ファイル表に工程の列**（`仕様の固定` / `仕様の実現`）を付ける。第 1 工程に置くのは次のもの
  - テスト: `__tests__/`、`*_test.rs`、判定表のケースとその共有物
  - 骨組み: 第 1 工程で足す公開 API のシグネチャと仮の戻り値。新しい関数・コンポーネント、直和に足す枝（reducer の case は state をそのまま返す）、型に足すフィールドを含む
  - 型を通すために要る呼び出し側の機械的な書き換え: 本番コード・既存テスト・既存の `*.stories.tsx` の呼び出し側（`SKILL.md` フェーズ 3 の手順 1 で数えたもの）
  - 判定表を新設するなら、その配線（`harness/githooks/pre-push` の `run_check` 等）
- 既存テストの期待値を変えるときは、第 1 工程で書き換えて RED（失敗の 1 行目が下の「認める形」に入る落ち方）に数える
- 第 2 工程に置くのは実装と新しいストーリー
- **RED 表。** 別の表ではなく、計画の「テストケースの一覧」に列を足したものを指す。各行に、テスト名 / 骨組みの仮の戻り値 / 期待値 / 第 1 工程での結果（RED か、骨組みで通るか）/ 予想する失敗の 1 行目 を書く。行は第 2 工程で通す順（単純なものから）に並べる。三角測量（同じ公開 API に別の入力で足すテスト）もここに載せる
- **予想する失敗の 1 行目として書ける形**（これ以外は assert に届いていない）

  | 対象 | 認める形 |
  | --- | --- |
  | vitest | `AssertionError: …` / `TestingLibraryElementError: …` / 予告した `Error: cannot unwrap an Err result: …` / 予告した `Error: cannot unwrap a None option` |
  | `cargo test` | ``assertion `left == right` failed`` / `assertion failed: …` / 予告した ``called `Result::unwrap()` on an `Err` value: …`` / 予告した ``called `Option::unwrap()` on a `None` value`` |
  | 判定表 | `NG   expected=<期待> got=<実際>  <ラベル>`（`got=broken` は除く） / 予告した `NG   検出器の種別が docstring の一覧と食い違う（実装: … / docstring: …）` / 予告した `NG   <種別> を期待するケースが表に無い`（後の 2 つは `.claude/hooks/lib/cases-report.sh` の種別照合で、骨組みの検出器と docstring・表の種別が揃っていないと出る） |

  認めない形: `TypeError:`、`Cannot find module`（ファイル単位の失敗）、`error[E0425]` などのコンパイルエラー、`not yet implemented`（`todo!()`）、`got=broken`
- **仮の戻り値の作り方**
  - 期待値と違う値を選ぶ（`rules/testing.md`、判例 `test-default-input`）
  - `Ok` / `Some` で期待値と違う値を作れるならそちらにする（assert まで届くため）
  - ドメインの値は既存の `create`（Smart Constructor）やフィクスチャで作る。`as` では作らない（`rules/coding.md`）
  - 作れないときだけ `Result.err` / `Option.none` を返し、RED 表に unwrap の失敗を予告して、どの呼び出しの unwrap かを書く。ドメインのエラーはオブジェクトなので 1 行目が `Error: cannot unwrap an Err result: [object Object]` で終わり、セットアップの unwrap の失敗と見分けられないため
  - `throw` / `todo!()` は使わない
  - 使わない引数は頭に `_` を付ける（TS は `noUnusedParameters`、Rust は clippy の `-D warnings`）。doc を付ける（pre-push の doc コメント検査が骨組みにも掛かる）
- 骨組みのままで通るテストは理由を付けて RED 表に載せる。同じ公開 API に RED のテストが 1 件以上あるときだけ認める
- 型テスト（`expectTypeOf`）は RED の対象外とする（シグネチャ自体が骨組みであり、第 1 工程の typecheck で通る）
- 判定表を持つスクリプトの骨組みは「何も出さず exit 0」にする（`NG expected=deny got=pass` で落ちる。スクリプトがないと `got=broken`）
- **第 1 工程を省く条件:** 自動テストで落とせるものがない場合（doc・設定だけ、判定表を持たないスクリプト、位置・大きさ・class だけの見た目）。省くときは理由と代わりの確かめ方を書く。一部だけ当たるなら、その部分を第 1 工程に置かず理由を書く
- 既存の振る舞いの誤りを直す作業（拠り所が既存の `docs/` やテストにある）は `flow:bugfix`、振る舞いを変えない作業は `flow:refactor` であり、`flow:feature` に合わない作業なので、計画せずに止めて `SKILL.md` フェーズ 1「種類の確定」の 6 に従う

## フェーズ 5: 工程ごとに書かせるものと確かめること

2 工程に分ける仕組み（工程の渡し方・第 1 工程のコミット・第 1 工程を省く場合）は `SKILL.md` フェーズ 5 を参照。

1. **第 1 工程（`工程: 仕様の固定`）: ファイル表で第 1 工程にしたものだけを書かせる。** 返ってきたら、親が commit の前に自分で次のコマンドを走らせ、出力を RED 表と目で突き合わせる。jq は vitest の status で絞って 1 行目を並べるだけで、assert かどうかの分類は持たない（分類のコードをこの文書に埋めない理由は `refactor.md` フェーズ 5 の末尾と同じ。機械検査は #1406）
   - vitest

     ```bash
     out=$(mktemp)
     pnpm exec vitest run --reporter=json --outputFile="$out"
     jq -r '.testResults[] | select(.status != "passed") | (.name + "\t" + ((.message // "") | split("\n")[0] // "")), (.assertionResults[] | select(.status != "passed") | "  " + .status + "\t" + .title + "\t" + ((.failureMessages[0] // "") | split("\n")[0] // ""))' "$out"
     ```

     - 字下げした行の集合が、RED 表で RED としたテストの集合と一致すること
     - 各行の 1 行目が「認める形」に入ること
     - ファイル行のタブの後にメッセージが出たら、import の失敗にあたる
     - unwrap を予告した行は `jq -r --arg t "<テスト名>" '.testResults[].assertionResults[] | select(.title == $t) | .failureMessages[0]' "$out" | head -3` で引く。3 行目が RED 表に書いた呼び出しの行であること（3 行目は unwrap を呼んだ関数の行なので、`setup()` などのヘルパーの中で呼んだ場合はそのヘルパーの行になる）
   - `src-tauri/`（`TAURI_SETUP.md`「Rust 側の検査」）: `cd src-tauri` してから
     - `cargo clippy --all-targets --locked -- -D warnings`: exit 0
     - `cargo test --locked 2>&1 | grep -E -A1 'panicked at|^error\[E|^error: could not compile'`: 並ぶ panic が RED 表の RED だけで、コンパイルエラーの行（`error[E…]` / `error: could not compile`）がないこと。RED があると必ず出る `error: test failed, to rerun pass …` は拾わない
   - 判定表: `bash <表> | grep '^NG'` が予告した行だけを出し、`got=broken` がないこと
   - pre-push: `PRE_PUSH_REQUIRE_ALL=1 bash harness/githooks/pre-push`
     - pre-push の `run_check` が走らせる判定表のケースを RED にしていない回は exit 0
     - RED にした回（新設した表を配線した、既存の表へケースを足した）は exit が 0 以外で、`pre-push: 失敗した検査:` 行に並ぶのがその表の検査名だけ、`pre-push: 飛ばした検査:` 行がないこと
   - 外れたら計画へ戻す。合格したら commit し、これを第 1 工程のコミットにする
2. **第 2 工程（`工程: 仕様の実現`）: RED 表の順に 1 件ずつ通させる。** `implementer` は各テストで次を回す
   1. そのテストだけを走らせて落ちることを確かめ、失敗の 1 行目を控える。走ったのがちょうど 1 件であることも確かめる（名前が当たらないと 0 件のまま exit 0 になり、「先に通った」と取り違えるため）
      - vitest: `-t` は正規表現として照合されるので、記号をエスケープして `^` と `$` で挟む。テスト名はシングルクォートで囲む（名前に `'` があれば `'\''` にする）。出力の `Tests` 行で skipped 以外が 1 件であること

        ```bash
        t=$(printf '%s' '<テスト名>' | sed 's/[][\\.^$*+?(){}|]/\\&/g')
        pnpm exec vitest run <ファイル> -t "^${t}\$"
        ```

      - Rust: `cd src-tauri` して `cargo test --locked -- --exact '<テストのフルパス>'`（フルパスは `cargo test --locked -- --list` に出る名前）。出力を `grep -E '^running [1-9]'` で絞ると `running 1 test` の 1 行だけになること
      - 判定表: `bash <表>` の該当行
   2. 通る最小の実装を書き、同じコマンドで通ることを確かめて次へ進む
   3. サイクルの前に既に通っていたら「先に通った」と控える

   - 返させるもの: サイクルごとのテスト名・コマンド・実装前の失敗の 1 行目（または「先に通った」）・触ったファイル・通ったこと。最後に `SKILL.md` フェーズ 7 の 2 つの検査の終了コード
   - 第 1 工程のテストと骨組みのシグネチャは変えさせない。変える必要が出たら止めて返させる。テストを足すのも計画外とする。`_` を外す引数名の変更は、シグネチャの変更として止める対象に含めない
   - 返ってきたら、親が次を確かめる
     - (a) `SKILL.md` フェーズ 5 の `git diff --exit-code`
     - (b) commit した後に `refactor.md`「書き換えない範囲」の 2 つのコマンド。1 つ目の出力に出てよいのは、ファイル表で第 2 工程に挙げたストーリーだけ。2 つ目は空。`refactor.md` の「してよいこと」（移動・改名）は `flow:feature` には当てはめない
     - (c) テスト名の集合が一致すること: 「サイクルで RED→GREEN（GREEN は通ること）にしたもの」∪「先に通ったと申告したもの」＝ RED 表の RED 集合で、過不足も重複もない
     - (d) 各サイクルの実装前の 1 行目が「認める形」に入ること。値は見ない（前のサイクルで変わるため）
     - (e) 返ってきた pre-push と `test:run` が exit 0
     - (f) `git diff <第 1 工程のコミット> -- <骨組みのファイル>` を読み、骨組みのシグネチャが変わっていないこと（`_` を外す改名は除く）
   - (c)(d) は `implementer` の申告を見るだけで、RED→GREEN を実際に回したかまでは確かめられない。機械的な拠り所は、親が自分で出力を取った第 1 工程のコミットである
   - 外れたら、その行を指摘として `implementer` に戻す。先に通ったテストがあれば Issue に書く

**第 1 工程を省いた場合**（フェーズ 3 で自動テストで落とせるものがないと判断した場合）は、`implementer` に `工程: 仕様の実現` を渡し、サイクルの記録は求めない。代わりに、計画に書いた代わりの確かめ方を行わせてその結果を返させ、親が Issue に書く。

## フェーズ 6: 直しでは第 1 工程のテストを変えない

- 指摘に応えてテストを足すのはよい（同じファイルでもよい）。第 1 工程のテストを書き換える・消す・skip するのはしない
- 直させるたびに、親が次を確かめる
  - commit した後に `git diff --numstat <第 1 工程のコミット> HEAD -- <第 1 工程のテストのファイル>` の削除列がすべて 0（commit 前に走らせると HEAD との比較なので直しが入らない）
  - `refactor.md`「書き換えない範囲」の 2 つのコマンド。1 つ目は、テストへの追加行がまるごと新しいテスト（とその import）であり、既存テストの本文の中への追加ではないことを目で確かめる。2 つ目は空
- **`test-reviewer` はそのまま呼ぶ。**

## フェーズ 7: PR 本文に 2 つの工程のコミットと RED の出力

PR 本文に、**第 1 工程のコミット**と第 2 工程以降のコミットを並べて書く。あわせて、第 1 工程で親が取った出力（jq、`src-tauri/` があれば cargo、判定表があれば `grep '^NG'`）を添え、マージ後も RED を辿れるようにする。第 1 工程を省いた場合は、その理由と代わりの確かめ方の結果を書く。
