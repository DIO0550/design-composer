---
name: pr-explain
description: "PR ごとの解説ページ(技術解説・振る舞いの判断・特に見てほしい箇所)を HTML で書き、gh-pages の pr-explain/pr-<番号>/ へ公開する。implementation-flow のフェーズ 7 で PR を出した直後と、振る舞いが変わる push の後に使用する。「PR の解説を書いて」「解説ページを更新して」といった依頼でも使用する。変更の地図(変更ファイル・テスト名の増減)は Actions が置くので書かない。"
---

# PR の解説ページ

レビュアー(人間)が PR を開いたときに、**この PR で使った技術・振る舞いをどうしたか・どこを
見てほしいか**を 1 ページで読めるようにする。diff と Issue だけでは、長いセッションで何を使い、
なぜその振る舞いにしたかが掴みにくいため。

ページは 2 人で分け合う。

| 部分 | 書く人 | 中身 |
| --- | --- | --- |
| 解説(このスキル) | 実装したセッション | 概要・振る舞いの変化・判断・技術解説・特に見てほしい箇所 |
| 変更の地図 | `pr-explain.yml`(Actions) | 変更ファイルを読む順に並べた一覧・テスト名の増減・解説の古さ |

URL は `https://dio0550.github.io/design-composer/pr-explain/pr-<番号>/`。Storybook プレビューの
固定コメントに載るので、別にコメントしない。**PR ブランチにも main にも入れない**(main に
溜まり、Files changed にも混ざるため)。

## いつ書くか

- **PR を出した直後**(`implementation-flow` フェーズ 7)
- **振る舞いが変わる push をした後**。format・コメントだけの push では書き直さない
  (ページ側が「解説は古い」帯に以降の変更ファイルを出すので、読み手が判断できる)
- **PR を reopen した後**(閉じたときに Actions がフォルダごと消し、テンプレートに戻っている)

## 手順

1. **材料を集める**
   - Issue: ゴール・計画・却下した案・計画から外れた点(`implementation-flow` が書いている)
   - 差分: `git diff $(git merge-base origin/main HEAD)`
   - このセッションの記憶: Issue に書くほどではなかった判断・試して捨てた形
2. **解説の断片を、リポジトリの外の作業用ファイルに書く**(`mktemp -d` など)。書くのは
   `templates/index.html` の `<!-- EXPLAIN:BEGIN -->` 〜 `<!-- EXPLAIN:END -->` の間に入る部分だけで、
   枠(CSS・固定スクリプト・CSP)は公開のときにスクリプトがテンプレートから写す
3. **下の「節の構成」と「部品」で書く**
4. **事実の主張を確かめる。** 解説は「この関数は◯◯を返す」「この操作で□□になる」の集まりなので、
   `claim-verification` スキル(管轄はフェーズ 3 / 5)の手順をここでも使う。根拠の `path:line` は
   実際に開いて行番号まで合わせる
5. **公開する**

   ```bash
   bash .github/scripts/pr-explain-pages.sh put-page <PR 番号> <書いた断片>
   ```

   - push の前に `build-pr-explain-page.py` が断片を検査してページを組み立てる。落ちたら報告を読んで直す
   - **終了コード 3** は置き先に `change-map.json` がまだ無い(`PR Explain` の run が終わる前)か、
     PR が閉じて消された後。run の完了を待ってからやり直す。閉じた PR には置かない
   - **gh-pages へ push してよいのは、このスクリプトで `pr-explain/pr-<番号>/` へ置くときだけ。**
     他のフォルダ・他のブランチは触らない
6. **URL をユーザーに伝える**

## 節の構成

読み手は、このリポジトリの規約は知っているが、**この PR で使った技術やこのセッションの経緯は
知らない人**とする。専門用語は出たその場で一言で説明する。順に読まなくても、気になる節だけ
拾い読みできるように書く。

| 節 | 書くこと | 書かないこと |
| --- | --- | --- |
| 概要 | 何ができるようになったか・何が変わったかを 2〜3 段落の散文で。必要なら全体の流れの図 | 変更ファイルの列挙(地図が出す) |
| 振る舞いの変化 | **操作・状況ごと**に変更前と変更後。空・エラー・境界の状況も 1 行ずつ | 実装の手順 |
| 判断 | 採った案・検討した案(または計画にあった案)・理由・根拠。計画から外れた点と見送った点もここ | Issue の写し。Issue へのリンクを添えて要点だけ |
| 技術解説 | 使った技術(React の API・TypeScript の型の技法・Tauri・ブラウザ API・アルゴリズムなど)ごとのミニ記事。**何か → この PR での使いどころ → 仕組み(図) → コード抜粋 → 注意** を散文で | どの PR にも同じ文になる一般論だけの記事(この PR の使いどころへ必ず繋げる) |
| 特に見てほしい箇所 | 自信のない判断・未決のまま入れたもの・テストで守れていない振る舞い・目で見ないと分からない表示 | 「全体を見てください」 |
| 用語(任意) | この PR に出てくる語の短い定義 | |

- 根拠は **リポジトリ相対のフルパス**で `<code class="ref">src/utils/Option.ts:12</code>` と書く。固定
  スクリプトが解説時点の GitHub の該当行へのリンクにし、地図は「解説に出てこない変更ファイル」を
  フルパスの一致で数える(ファイル名だけでは数えない)
- ページ全体で 10 分ほどで読める長さを目安にする。技術解説は、この PR を読むのに要る技術だけ

## 部品

断片の先頭には `explain-meta` を 1 つだけ置く(無い・sha が 40 桁でない・PR 番号が違うと検査で落ちる)。
`data-explained-sha` は解説を書いた時点の PR の head(`git rev-parse HEAD`。push 済みのもの)で、
根拠のリンク先になり、地図の head と違うと「古い」帯が出る。

`kicker` は見出しの頭に付ける小さな分類の札、`lead` は題の下の要約の段落。

```html
<p class="explain-meta" data-explained-sha="<40 桁の sha>" data-pr="<PR 番号>">解説時点 <code><7 桁></code> · 材料 <a href="https://github.com/DIO0550/design-composer/issues/<番号>">Issue #<番号></a></p>
<h1><PR の題></h1>
<p class="lead"><1〜2 文の要約></p>

<h2 id="overview">概要</h2>
<p>…</p>

<h2 id="behavior"><span class="kicker">振る舞い</span>振る舞いの変化</h2>
<table class="behavior">
  <tr><th>操作・状況</th><th>変更前</th><th>変更後</th><th>根拠</th></tr>
  <tr><td>…</td><td>…</td><td>…</td><td><code class="ref">src/…/index.ts:12</code></td></tr>
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

<h2 id="tech"><span class="kicker">技術</span>技術解説</h2>
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
  <div class="note info">…</div><!-- 注意は note warn -->
</article>

<h2 id="focus"><span class="kicker">レビュー</span>特に見てほしい箇所</h2>
<ul class="focus"><li>…</li></ul>
```

`.decision` の `data-kind` は `判断` / `逸脱`(計画から外れた) / `見送り` のどれか。

**書けないものの一覧は `build-pr-explain-page.py` の定数が持つ**(違反は報告に出る。枠の CSP でも
ブラウザが止める)。書くときに押さえるのは次の 3 つ。

- 動くもの・外から読むもの(`<script>` `<style>` `<iframe>`・`on*=`・`style` 属性)を書かない。
  色や余白はテンプレートのクラスで付ける。図は `d-box` `d-accent` `d-line` `d-text` `d-muted`
- リンクはこのリポジトリの github.com・Pages・ページ内(`#…`)だけ
- HTML のコメント(`<!-- -->`)も書かない

**コード抜粋は必ずエスケープする**(`&` → `&amp;`、`<` → `&lt;`、`>` → `&gt;`)。JSX の抜粋を
そのまま貼ると要素として解釈され、`onClick=` が属性になって検査で落ちる。

## 参照ファイル

| ファイル | 内容 |
| --- | --- |
| [`templates/index.html`](templates/index.html) | 枠(CSS・固定スクリプト・CSP)。固定スクリプトを変えたら CSP の `sha256-` も直す(組み立てのスクリプトが突き合わせる) |
| `.github/scripts/build-pr-explain-page.py` | 断片の検査とページの組み立て |
| `.github/scripts/pr-explain-pages.sh` | gh-pages の `pr-explain/pr-<番号>/` の書き換え(`put-page` / `put-map` / `remove`) |
| `.github/scripts/build-pr-change-map.py` | 変更の地図(Actions が呼ぶ) |
| `.github/workflows/pr-explain.yml` | 地図の配置と、PR が閉じたときの削除 |
