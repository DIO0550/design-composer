# UI差分のプリフライト

UI(見た目・構成)を変更する差分を書く前に、次を**この順番で**実行し、実行した
コマンドと結果を Issue または作業ログに残す。フェーズ 5 で使う。

`rules/ui-verification.md`「UIの拠り所」に書かれていた段取りを、**毎回同じ順序で
踏む必要があり、順番を間違えると数え違いに気づけない**ことから、観点(読むだけの
チェックリスト)ではなくここへ移した(`harness/records/` の `ui-fidelity` 分類が
`rules/` 層への追記のあとも再発したため)。

## 1. `docs/Design Composer.html` のマークアップを展開する

**見るのはスクリーンショットではなくマークアップ。** 画像からは色・余白・字面の
実測値が取れず、「開いたのに読めていない」状態になる(過去実績: アイコンが素の
div であることと、帯の色・画面数・gap を取り違えている)。マークアップは
`<script type="__bundler/template">` の**JSON 文字列**に入っているので、次のように
展開してから該当箇所を切り出す。

```bash
python3 -c '
import json, re
raw = open("docs/Design Composer.html", encoding="utf-8").read()
body = re.search(r"<script type=\"__bundler/template\">(.*?)</script>", raw, re.S).group(1)
print(json.loads(body))
' > /tmp/ui-plan.html
```

## 2. 対象画面を区切りコメントで探す

展開後は 10 万字ほどの HTML になる。`<!-- RIGHT PANEL -->` のような区切りコメントが
画面(Default / Assets / Assets · Instance / Tokens / Error)ごとに入っているので、
そこを目印に該当箇所を読む。

## 3. 使う値・綴りを `grep -i` で数え直す

実装に使うつもりの色・spacing・文言・アイコンの綴りが UI 案に**何回出てくるか**を
数える。**大文字小文字を無視する(`grep -i`)こと。** UI 案は小文字で書いて CSS の
`text-transform:uppercase` で大文字にしている箇所がある。`grep "STALE"` は 0 を返すが、
`grep -i "stale"` は 1 を返す。**「0 回だから UI 案に無い」と結論する前に、必ず
`-i` で数え直す**(この読み違いで、実在する `STALE · LAST VALID` バッジを「今の案には
無い」と誤って訂正しかけた / #112)。

```bash
grep -io "<値・綴り>" /tmp/ui-plan.html | wc -l
```

## 4. プロトタイプと違う形にするなら、実装前に確認を取る

1〜3 の結果、プロトタイプに無い操作・違う数値になる場合は、黙って寄せず・黙って
離れず、理由を添えて確認する(`rules/ui-verification.md`「UIの拠り所」)。

---

1〜4 で実行したコマンドと数えた結果を、Issue の計画または実装ログに残す。残って
いなければ、フェーズ 6 の実装検証は「プリフライト未実行」として差し戻す。
