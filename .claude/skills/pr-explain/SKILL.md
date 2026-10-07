---
name: pr-explain
description: "PR ごとの解説ページ(入口・振る舞い・技術・テストの 4 ページ)を HTML で書き、gh-pages の pr-explain/pr-<番号>/ へ公開する。implementation-flow のフェーズ 7 で PR を出した直後と、振る舞いが変わる push の後に使用する。「PR の解説を書いて」「解説ページを更新して」といった依頼でも使用する。変更の地図(変更ファイル・依存・テスト名の増減・コミット)は Actions が置くので書かない。"
---

# PR の解説ページ

レビュアー(人間)が PR を開いたときに、**この PR で振る舞いをどうしたか・使った技術とコードの
読み方・テストが何を守っているか**を読めるようにする。diff と Issue だけでは、長いセッションで
何を使い、なぜその振る舞いにしたかが掴みにくいため。

**読む目的ごとにページを分ける。** 振る舞いはマージしてよいかを決めるために、技術は理解のために
後からじっくり、テストは守られている範囲の確認に読む。1 ページにまとめると、長い技術解説に
振る舞いが埋もれる。

| ページ(ファイル) | セッションが書くもの | 固定スクリプトが地図から足すもの |
| --- | --- | --- |
| 入口(`index.html`) | 概要・特に見てほしい箇所・各ページへの案内 | 依存の図(すべての変更ファイルを、つながっているまとまりごとの帯に分けたもの)・ファイルごとのつながりのカード・変更ファイルの一覧(読む順) |
| 振る舞い(`behavior.html`) | 操作ごとの変更前と変更後・判断(逸脱・見送り) | なし |
| 技術(`tech.html`) | 処理の流れ・どこで何をしているか・技術解説・コードの読み方 | 解説に出てこない変更ファイル |
| テスト(`tests.html`) | 各テストが守る振る舞い・守れていない振る舞い・壊して確かめた結果 | 追加・削除されたテスト名 |

変更の地図(`change-map.json`)は `pr-explain.yml`(Actions)が git の差分から作る。上部のナビで
4 ページを行き来し、書かなかったページは「なし」と出る。**該当しないページは書かない**
(ドキュメントやハーネスの文書だけの PR ならテストのページは要らない。入口は必ず書く)。

URL は `https://dio0550.github.io/design-composer/pr-explain/pr-<番号>/`(入口)。Storybook
プレビューの固定コメントに載るので、別にコメントしない。**PR ブランチにも main にも入れない**
(main に溜まり、Files changed にも混ざるため)。

## いつ書くか

- **PR を出した直後**(`implementation-flow` フェーズ 7)
- **振る舞いが変わる push をした後**。変わったページだけを書き直す。format・コメントだけの push
  では書き直さない(各ページの「古い」帯に以降の変更ファイルが出るので、読み手が判断できる)
- **PR を reopen した後**(閉じたときに Actions がフォルダごと消し、入口がテンプレートに戻っている)

## 手順

1. **材料を集める**
   - Issue: ゴール・計画・却下した案・計画から外れた点(`implementation-flow` が書いている)
   - 差分: `git diff $(git merge-base origin/main HEAD)`
   - 検証エージェントの指摘: とくに `test-reviewer` の「壊して落ちた / 落ちなかった判断」はテストの
     ページの材料
   - このセッションの記憶: Issue に書くほどではなかった判断・試して捨てた形
2. **ページごとに解説の断片を、リポジトリの外の作業用ファイルに書く**(`mktemp -d` など)。書くのは
   `templates/index.html` の `<!-- EXPLAIN:BEGIN -->` 〜 `<!-- EXPLAIN:END -->` の間に入る部分だけで、
   枠(CSS・固定スクリプト・CSP)は公開のときにスクリプトがテンプレートから写す
3. **下の「ページごとの中身」と「部品」で書く**
4. **事実の主張を確かめる。** 解説は「この関数は◯◯を返す」「この操作で□□になる」の集まりなので、
   `claim-verification` スキル(管轄はフェーズ 3 / 5)の手順をここでも使う。根拠の `path:line` は
   実際に開いて行番号まで合わせる
5. **ページごとに公開する**

   ```bash
   bash .github/scripts/pr-explain-pages.sh put-page <PR 番号> <index|behavior|tech|tests> <書いた断片>
   ```

   - push の前に `build-pr-explain-page.py` が断片を検査してページを組み立てる。落ちたら報告を読んで直す
   - **終了コード 3** は置き先に `change-map.json` がまだ無い(`PR Explain` の run が終わる前)か、
     PR が閉じて消された後。run の完了を待ってからやり直す。閉じた PR には置かない
   - **gh-pages へ push してよいのは、このスクリプトで `pr-explain/pr-<番号>/` へ置くときだけ。**
     他のフォルダ・他のブランチは触らない
6. **URL をユーザーに伝える**

## ページごとの中身

読み手は、このリポジトリの規約は知っているが、**この PR で使った技術やこのセッションの経緯は
知らない人**とする。専門用語は出たその場で一言で説明する(`<abbr title="説明">語</abbr>` にすると、点線の
下線に載せたときに説明が出る。本文を説明で長くしたくない語に使う)。どのページも単独で読めるように書き、
別のページの内容が要るところはリンクで渡す(`<a href="tests.html#…">`)。

| ページ | 節 | 書くこと | 書かないこと |
| --- | --- | --- | --- |
| 入口 | 概要 | 何ができるようになったか・何が変わったかを 2〜3 段落の散文で。必要なら全体の流れの図 | 変更ファイルの列挙(地図が出す) |
| 入口 | 特に見てほしい箇所 | 自信のない判断・未決のまま入れたもの・目で見ないと分からない表示。詳しい説明は各ページへリンク | 「全体を見てください」 |
| 入口 | 各ページの案内 | 各ページに何が書いてあるかを 1 行ずつ | |
| 振る舞い | 振る舞いの変化 | **操作・状況ごと**に変更前と変更後。空・エラー・境界の状況も 1 行ずつ。守っているテストへリンク | 実装の手順 |
| 振る舞い | 判断 | 採った案・検討した案(または計画にあった案)・理由・根拠。計画から外れた点と見送った点もここ | Issue の写し。Issue へのリンクを添えて要点だけ |
| 技術 | 処理の流れ | ページの先頭に置く。主な流れ(いつ・誰が・何を・どの順に呼ぶか)ごとに 1 枚の流れの図(`pre.sequence`)。2〜4 枚 | 1 つの関数の中の手順(それは抜粋で見せる) |
| 技術 | どこで何をしているか | 処理の流れの次に置く。この PR がやっていること(振る舞い・処理)ごとに、**それをしているコードそのもの**(PR の起点からの diff の抜粋。読み手が差分とコードの表示を切り替える)と、何をしているかの 1〜2 文・誰がいつ呼ぶか・場所(`path:開始-終了`)。抜粋は 1 か所 5〜25 行で、要の関数・分岐を省略せずに出す | 場所だけの表(どこを開けばよいかは分かっても、何をしているかは読めない) |
| 技術 | 技術解説 | 使った技術(React の API・TypeScript の型の技法・Tauri・ブラウザ API・アルゴリズムなど)ごとのミニ記事。**何か → この PR での使いどころ → 仕組み(図) → コード抜粋 → 注意** を散文で | どの PR にも同じ文になる一般論だけの記事(この PR の使いどころへ必ず繋げる) |
| 技術 | コードの読み方 | 地図の読む順に、ファイル(またはまとまり)ごとの役割と、呼び出しの流れの中での位置 | diff の全文・「どこで何をしているか」と同じ抜粋の再掲(`#w-…` へリンクする) |
| テスト | 守っている振る舞い | 振る舞いごとに、それを守るテスト(ファイルとテスト名)。振る舞いのページの行へリンク | テストコードの写し |
| テスト | 守れていない振る舞い | テストで確かめられず、目視や運用で確かめているもの・残した穴 | |
| テスト | 壊して確かめた結果 | `test-reviewer` が壊して落ちた判断・落ちなかったものと、その対応 | |

- 根拠は **リポジトリ相対のフルパス**で `<code class="ref">src/utils/Option.ts:12</code>` と書く。固定
  スクリプトが解説時点の GitHub の該当行へのリンクにする。技術のページでは、地図が「本文に
  フルパスで出てこない変更ファイル」を出す(ファイル名だけでは数えない)ので、コードの読み方で
  変更ファイルをすべて名指しする
- 各ページ 5〜10 分で読める長さを目安にする。技術解説は、この PR を読むのに要る技術だけ

## 部品

断片の先頭には `explain-meta` を 1 つだけ置く(無い・sha が 40 桁でない・PR 番号やページ名が
公開先と違うと検査で落ちる)。`data-explained-sha` は解説を書いた時点の PR の head
(`git rev-parse HEAD`。push 済みのもの)で、根拠のリンク先になり、地図の head と違うと「古い」帯が
出る。`data-page` は `index` / `behavior` / `tech` / `tests` のどれか。

`kicker` は見出しの頭に付ける小さな分類の札、`lead` は題の下の要約の段落。

```html
<p class="explain-meta" data-explained-sha="<40 桁の sha>" data-pr="<PR 番号>" data-page="behavior">解説時点 <code><7 桁></code> · 材料 <a href="https://github.com/DIO0550/design-composer/issues/<番号>">Issue #<番号></a></p>
<h1><PR の題>: 振る舞い</h1>
<p class="lead"><1〜2 文の要約></p>

<h2 id="behavior"><span class="kicker">振る舞い</span>振る舞いの変化</h2>
<table class="behavior">
  <tr><th>操作・状況</th><th>変更前</th><th>変更後</th><th>根拠</th></tr>
  <tr id="b-1"><td>…</td><td>…</td><td>…</td><td><code class="ref">src/…/index.ts:12</code> · <a href="tests.html#t-1">テスト</a></td></tr>
</table>

<h2 id="decisions"><span class="kicker">判断</span>判断</h2>
<div class="decision" data-kind="判断">
  <h3><何を決めたか></h3>
  <dl>
    <dt>採った案</dt><dd>…</dd>
    <dt>検討した案</dt><dd>…</dd>
    <dt>理由</dt><dd>…</dd>
    <dt>根拠</dt><dd><code class="ref">…</code></dd>
  </dl>
</div>
```

入口のページ:

```html
<p class="explain-meta" data-explained-sha="<40 桁の sha>" data-pr="<PR 番号>" data-page="index">解説時点 <code><7 桁></code> · 材料 <a href="https://github.com/DIO0550/design-composer/issues/<番号>">Issue #<番号></a></p>
<h1><PR の題></h1>
<p class="lead"><1〜2 文の要約></p>

<h2 id="overview">概要</h2>
<p>…</p>

<h2 id="focus"><span class="kicker">レビュー</span>特に見てほしい箇所</h2>
<ul class="focus"><li><strong>…</strong>…<a href="behavior.html#b-1">振る舞い</a></li></ul>

<h2 id="guide">各ページの案内</h2>
<ul><li><a href="behavior.html">振る舞い</a>: …</li></ul>
```

技術のページの「どこで何をしているか」と、記事と、コードの読み方の 1 ファイル分:

```html
<h2 id="where"><span class="kicker">コード</span>どこで何をしているか</h2>
<h3 id="w-1"><やっていること></h3>
<p><何をしているかの 1〜2 文>。<code>Foo.bar</code> から、ノードを選ぶたびに呼ばれる。</p>
<p class="where-ref"><code class="ref">src/…/index.ts:12-30</code></p>
<pre class="code" data-diff><code>@@ -10,17 +12,19 @@
 変えていない行
-消した行
+足した行</code></pre>
```

抜粋の `where-ref` と `pre` は手で写さず、**解説時点の head の作業ツリーで、行範囲から作る**。PR の
起点(merge-base)からの diff になり、中身はエスケープされる。範囲は変更後のファイルの行番号で、
範囲の中で消した行も入る。

```bash
python3 .github/scripts/build-pr-explain-excerpt.py <path> <開始行> <終了行> --base "$(git merge-base origin/main HEAD)"
```

固定スクリプトはこれを、GitHub と同じ**差分**(変更前・変更後の行番号と `+` / `-`)と、変更後の行だけの
**コード**(足した行は左端の印)の 2 つの表示に組み直す。最初は差分で、抜粋ごとの切り替えとヘッダの
「すべてコードで表示」で読み手が選ぶ。

```html
<article class="tech">
  <h3><span class="kicker">React</span>useSyncExternalStore</h3>
  <p>…</p>
  <figure class="diagram">
    <svg viewBox="0 0 480 120" role="img" aria-label="…">
      <rect x="10" y="20" width="120" height="48" rx="6" class="d-box"/>
      <text x="70" y="49" text-anchor="middle" class="d-text">…</text>
      <line x1="130" y1="44" x2="200" y2="44" class="d-line"/>
    </svg>
    <figcaption>…</figcaption>
  </figure>
  <pre class="code" data-file="src/…/index.ts"><code>…(&amp; &lt; &gt; をエスケープ)…</code></pre>
  <div class="note info">…</div>
</article>

<h3><code class="ref">src/…/index.ts</code></h3>
<p><このファイルの役割と、呼び出しの流れの中での位置></p>
<p>このまとまりの抜粋は <a href="#w-1">…</a></p>
```

テストのページの表:

```html
<table>
  <tr><th>守る振る舞い</th><th>テスト</th><th>壊して確かめたか</th></tr>
  <tr id="t-1"><td><a href="behavior.html#b-1">…</a></td><td><code class="ref">src/…/__tests__/x.normal.test.ts:20</code> 「…のとき…になる」</td><td>落ちた</td></tr>
</table>
```

`.decision` の `data-kind` は `判断` / `逸脱`(計画から外れた) / `見送り` のどれか。注意書きは
`note info` の代わりに `note warn`。

技術のページの「処理の流れ」は、1 行 1 矢印で書く。`A -> B: 文` が呼び出し(実線)、`A --> B: 文` が
戻り(破線)で、固定スクリプトが参加者(最初に出た順に左から)の縦線と、番号付きの矢印の図にする。
`A -> A: 文` は自分の中の処理。読めない行が 1 つでもあると図にせず元の文字のまま出るので、ページで
図になっているかを見る。

```html
<h2 id="flow"><span class="kicker">流れ</span>処理の流れ</h2>
<h3 id="flow-push">PR を push したとき</h3>
<pre class="sequence" data-caption="PR のイベントから地図が置かれるまで">GitHub -&gt; pr-explain.yml: opened / synchronize
pr-explain.yml -&gt; build-pr-change-map.py: --base --head --pr
build-pr-change-map.py --&gt; pr-explain.yml: change-map.json</pre>
```

固定スクリプトが付けるもの(断片には書かない): 入口の依存の図とファイルごとのつながりのカード(地図の `dependencies` から)、抜粋ごとの
「確認した」とヘッダの「確認 n / 全体」(読み手のブラウザに解説の sha ごとに残る)、h2 とその下の h3 の
目次と、いま読んでいる見出しの印。

**書けないものの一覧は `build-pr-explain-page.py` の定数が持つ**(違反は報告に出る。枠の CSP でも
ブラウザが止める)。書くときに押さえるのは次の 3 つ。

- 動くもの・外から読むもの(`<script>` `<style>` `<iframe>`・`on*=`・`style` 属性)を書かない。
  色や余白はテンプレートのクラスで付ける。図は `d-box` `d-accent` `d-line` `d-text` `d-muted`
- リンクはこのリポジトリの github.com・Pages・ページ内(`#…`)・解説のほかのページ
  (`index.html` `behavior.html` `tech.html` `tests.html`)だけ
- HTML のコメント(`<!-- -->`)も書かない

技術解説の記事に置く数行の抜粋(`pre.code data-file`)は手で書き、行番号は付けない。その
**コード抜粋は必ずエスケープする**(`&` → `&amp;`、`<` → `&lt;`、`>` → `&gt;`)。JSX の抜粋を
そのまま貼ると要素として解釈され、`onClick=` が属性になって検査で落ちる。

`pre.code` は固定スクリプトが開閉できる枠に入れ、言語ごとに色を付ける(断片には書かない)。言語は
抜粋の上の `path:行`(`where-ref`)か `data-file` の拡張子で決まる。**拡張子が無い・中身の言語が
拡張子と違う**(`harness/githooks/pre-push`、HTML の中のスクリプト)ときは `data-lang` で指定する
(抜粋のスクリプトなら `--lang`)。書ける値はテンプレートの `Grammars`(言語名)と `LanguageByExtension`
(拡張子)のキー。どれでもない値は色が付かないだけで、検査では落ちない。`data-diff` の付いた抜粋は
diff として読み、差分 / コードの切り替えを付ける。

## 参照ファイル

| ファイル | 内容 |
| --- | --- |
| [`templates/index.html`](templates/index.html) | 4 ページが共有する枠(CSS・固定スクリプト・CSP)。固定スクリプトを変えたら CSP の `sha256-` も直す(組み立てのスクリプトが突き合わせる) |
| `.github/scripts/build-pr-explain-page.py` | 断片の検査とページの組み立て |
| `.github/scripts/build-pr-explain-excerpt.py` | 「どこで何をしているか」のコード抜粋(起点からの diff)を行範囲から作る |
| `.github/scripts/pr-explain-pages.sh` | gh-pages の `pr-explain/pr-<番号>/` の書き換え(`put-page` / `put-map` / `remove`) |
| `.github/scripts/build-pr-change-map.py` | 変更の地図(Actions が呼ぶ) |
| `.github/workflows/pr-explain.yml` | 地図の配置と、PR が閉じたときの削除 |
