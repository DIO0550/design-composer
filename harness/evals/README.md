# P-001 テスト配置例の除去実験

`rules/testing.md` の「配置と命名」にあるディレクトリ図を削っても、AI はテストの置き場所を選べるか。A には図を含む規約全文、B にはその6行を除いた同じ文章を渡す。仮説は、前後に残る配置・命名の規範だけでも正しく判断できること。反証は、例えば B でだけ隣の機能のテストフォルダを選ぶこと。

| 課題 | 条件 | 採点 |
| --- | --- | --- |
| grid-step | 単一モジュールの次のグリッド位置 | 配置・命名、グリッド上と間の入力、全期待値 |
| label-limit | 同名の隣接モジュールと旧テスト置き場がある | 対象機能への配置・命名、長さの両端とその外側、全期待値 |

## 試す

リポジトリルートから Python 3.10 以降、Git、Bash、awk が使える Linux/macOS で実行する。試行データにはリポジトリ外の新しいディレクトリを指定する。

```bash
cli=harness/evals/harness_eval.py
python3 "$cli" inventory
python3 "$cli" validate
runs=$(mktemp -d)
python3 "$cli" run --adapter replay --out "$runs/replay"
python3 "$cli" report "$runs/replay"
python3 -m unittest discover -s harness/evals -v
```

`replay` は既知の正しい回答で保存・採点・集計を確認する。モデルを呼ばずトークン数も計上しない。

### Claude Code で測る

`--bare`、`--tools`、`--max-budget-usd` 対応の Claude Code と、実験用の `ANTHROPIC_API_KEY` を用意する。`CLAUDE_MODEL_ID` には契約で利用できる完全なモデル ID を指定する。CLI が報告した実モデルと一致するかを試行ごとに確認する。

```bash
python3 "$cli" run --adapter claude --model "$CLAUDE_MODEL_ID" \
  --budget-usd 1 --timeout 90 --repeat 1 --out "$runs/claude"
python3 "$cli" report "$runs/claude"
```

予算は実験全体の米ドル建て推定額。4試行なら各呼び出しに全体の1/4以下を割り当てる。CLI の推定額はリクエスト単位で上限を超える場合がある。費用不明・予算上限・環境エラー時は後続の呼び出しを止める。各試行は空の作業場所と HOME を使い、単発1ターンで終わる。モデルにツールを提供せず、Claude Code の自動読込を止め、対象の規約を明示的に入力する。認証の環境変数は上記の実験用キーだけを引き継ぐ。

### 外部セッションで回答を集める

```bash
python3 "$cli" prepare --out "$runs/external"
```

1. `manifest.json` の試行順に、各 `prompts/<id>.txt` の全文だけを同じ条件の新規セッションに渡す。採点器・他の回答・manifest は渡さない。各セッションにツールや過去会話を付けない。
2. 各 JSON 回答を `answers/<id>.json` に以下の形で保存する。`prompt_sha256` は配布したファイルの SHA-256。採点前に配布物と回答の対応を照合する。

   ```json
   {
     "prompt_sha256": "<配布したファイルの SHA-256>",
     "answer": {"path": "<モデル回答のパス>", "cases": [{"input": 0, "expected": false}]}
   }
   ```

3. 同じモデル・ランタイム識別子で回収する。未着の回答を追加して再実行すると、採点済みの試行を保持したまま残りを採点する。

   ```bash
   python3 "$cli" collect "$runs/external" --model "$MODEL_ID" --runtime "$RUNTIME_ID"
   python3 "$cli" report "$runs/external"
   ```

`external` のモデルとランタイムは回収者の申告値。費用・時間・トークンは不明として扱う。各モードは別ディレクトリに記録する。

## 結果の読み方

- 1反復で2課題 × 2構成の4試行。課題・反復ごとに A/B の先行順を交替する。 `--repeat N` で同一条件を反復できる。
- 入口・全8規約・既存スキャンと付属 awk を固定コミット `d199ad2483ca82c1a9d2b9134460d04a2d89105d` から読む。浅い clone に履歴がない場合はそのコミットを取得する。`manifest.json` にコミット、課題・規約・評価器・配布物のハッシュ、実行条件を記録する。
- 回答はパスと入出力例のデータとして扱う。パスは対象モジュールと照合し、使い捨ての空ファイルで元のテスト規約スキャンを実行する。期待値と境界の網羅は固定した振る舞いから採点する。生成コードの実行や GitHub 操作は発生しない。
- `results.jsonl` の各行にチェック別の結果・失敗理由・計測値を保持する。同じ評価器の版で `report` を実行すると、課題別・反復別の結果と B−A の差が得られる。入力・cache read・cache create は別欄で、未取得値は「—」。成功率の分母には要件未達・時間切れ・安全性違反を含める。環境エラーと未実行は別に表示する。
- 全試行成功時の終了値は0。欠測・失敗時は非ゼロで、既に保存した結果は確認できる。試行外へのパスを回答した場合は安全性違反を記録して停止する。失敗をやり直す実験には新しい出力先を使う。
- この smoke は単発のテスト設計課題。実装・修正ループ・通常セッションの自動読込・フック発火・本番 PR の品質は測定対象外。判定は**保留**とし、本番の規約削除は追加課題、独立した holdout と実運用に近い条件での確認後に判断する。
