import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./design-document-DDnHGz6_.js";import{n as i,t as a}from"./screen-height-shell-B8lrQqp6.js";import{n as o,t as s}from"./file-paths-BfN7DJwb.js";import{n as c,t as l}from"./document-json-DBdAmLYl.js";import{f as u,g as d,h as f,m as p}from"./elapsed-CvnL8uSX.js";import{a as m,i as h,n as g,o as _,r as v,t as y}from"./opened-document-editor-C9rCGVGg.js";function b(e){return r.create({tokens:j.tokens,components:j.components,artboards:j.artboards.map(t=>t.name===`home`?{...t,children:e(t.children)}:t)})}function x(e){return{ipc:v.create({[E]:l.serialize(e)}).ipc,opened:{path:E,document:e}}}var S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;e((()=>{i(),o(),n(),p(),d(),_(),h(),c(),g(),S=t(),{expect:C,screen:w,waitFor:T}=__STORYBOOK_MODULE_TEST__,E=s(`/work/sample.dcmp`),D=v.create({[E]:l.serialize(f.document(u))}),O={title:`features/editor/OpenedDocumentEditor`,component:y,parameters:{layout:`fullscreen`},decorators:[e=>(0,S.jsx)(a,{children:(0,S.jsx)(e,{})})],args:{clock:m.create().clock,ipc:D.ipc,opened:{path:E,document:f.document(u)}}},k={name:`編集画面`},A={name:`同期に失敗した編集画面`,args:{ipc:v.create({}).ipc,opened:{path:s(`/work/missing.dcmp`),document:f.document(u)}}},j=f.document(u),M=r.create({tokens:j.tokens,components:j.components,artboards:[{name:`home`,width:360,height:240,props:{layout:`column`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`outer-panel`,type:`Box`,props:{paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`gray-100`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`inner-panel`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`deep-title`,type:`Text`,props:{content:`ふかい見出し`}}]}]}]}]}),N=r.create({components:j.components,artboards:j.artboards,tokens:{...j.tokens,typography:Object.fromEntries(Object.entries(j.tokens.typography).filter(([e])=>e!==`heading`))}}),P={name:`ドキュメント自身が不正な編集画面`,args:x(N)},F=b(e=>[{name:`home-badge`,type:`Box`,props:{placement:`absolute`,x:296,y:16,widthMode:`fixed`,width:44,heightMode:`fixed`,height:24,background:`primary`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[]},...e]),I={name:`絶対配置のノードがある編集画面`,args:x(F)},L=b(e=>[...e,{name:`home-box`,type:`Box`,props:{placement:`absolute`,x:170,y:70,widthMode:`fixed`,width:160,heightMode:`fixed`,height:80,rotation:90,background:`gray-100`},children:[{name:`home-box-chip`,type:`Box`,props:{placement:`absolute`,x:16,y:16,widthMode:`fixed`,width:40,heightMode:`fixed`,height:20,background:`primary`},children:[]}]}]),R={name:`回った Box の中に絶対配置のノードがある編集画面`,args:x(L)},z={name:`home-login`,ref:`居ない部品`,overrides:{label:`ログイン`}},B=r.create({tokens:j.tokens,components:j.components,artboards:j.artboards.map(e=>({...e,children:e.children.map(e=>e.name===z.name?z:e)}))}),V={name:`コンパイルできないドキュメントの編集画面`,args:x(B)},H=v.create({[E]:l.serialize(f.document(u))}),U={name:`ファイルが不正になった編集画面`,args:{ipc:H.ipc,opened:{path:E,document:f.document(u)}},play:async()=>{await T(()=>{C(H.isWatching(E)).toBe(!0)}),H.changeExternally(E,`{ 壊れた`),await T(()=>{C(w.getByText(`最後に正常だった表示`)).toBeDefined()})}},W={name:`入れ子のあるドキュメントの編集画面`,args:x(M)},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...k.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...k.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: filePath("/work/missing.dcmp"),
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...A.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れないので、失敗の帯が編集画
面の上に出る。表示そのものは保たれることをここで確認できる。`,...A.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "ドキュメント自身が不正な編集画面",
  args: argsOpening(DocumentWithDanglingToken)
}`,...P.parameters?.docs?.source},description:{story:`ドキュメント自身が不正な状態。アプリ内の編集で使用中トークンを消したあとも、その内容が自
動保存されたファイルを開き直した直後も、画面はこれになる。

ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
同じものは \`CompileFailed\` も映すが、あちらはキャンバスが描けない側の絵。`,...P.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithAbsoluteNode)
}`,...I.parameters?.docs?.source},description:{story:`絶対配置のノードが最初から居る編集画面。

\`home-badge\` を運ぶと親の中の座標が動き、\`home-title\` / \`home-login\` を運ぶと
ツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、
ここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。

絶対配置を持ち込むとその意味が変わる。`,...I.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "回った Box の中に絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithNodeInRotatedBox)
}`,...R.parameters?.docs?.source},description:{story:"回った Box の中に絶対配置のノードがある編集画面。\n\n`home-box-chip` を選んでから運ぶと、祖先だけが回っているノードの座標の置き直しを\n確かめられる（docs/06-ui.md「キャンバス直接操作」）。画面上でポインタが動いた向きへ動き、\n`home-box` の外接矩形の辺へ吸い付き、`home` へ落とすと付け替わる。付け替えると\n`home-box-chip` の向きと座標が書き換わり、画面上の向きと中心は離す直前のまま保たれる。",...R.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "コンパイルできないドキュメントの編集画面",
  args: argsOpening(DocumentWithMissingComponent)
}`,...V.parameters?.docs?.source},description:{story:`不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
開いた時点から不正でありうるようになったので到達する。

映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
見えると判断ごと間違って読まれる。`,...V.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正になった編集画面",
  args: {
    ipc: brokenFiles.ipc,
    opened: {
      path: SamplePath,
      document: EditorState.document(SampleEditorState)
    }
  },
  play: async () => {
    // 監視が張られる前に書き換えると通知が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(brokenFiles.isWatching(SamplePath)).toBe(true);
    });
    brokenFiles.changeExternally(SamplePath, "{ 壊れた");
    await waitFor(() => {
      expect(screen.getByText("最後に正常だった表示")).toBeDefined();
    });
  }
}`,...U.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れた編集画面。**このストーリーだけが 3 ペインの凍結を一度に映す**\n（帯の色 / 左ペインの淡色と `凍結中` / スクリムとバッジ / 右ペインの「選択は凍結中」）。\n\nこの `play` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら採\n用」なので、`play` が間に合わなければ**通常表示がベースラインに焼き付き、しかも失敗が\n誰にも見えない**。判定そのものは happy-dom 側で確かめている。",...U.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "入れ子のあるドキュメントの編集画面",
  args: argsOpening(DocumentWithDeepBranch)
}`,...W.parameters?.docs?.source},description:{story:"入れ子が 3 階層あるドキュメントを開いた編集画面。\n\nキャンバスのクリックが選ぶ階層（docs/06-ui.md）を操作して確かめるためのストーリー。\nクリックで `outer-panel`、ダブルクリックを重ねて `inner-panel` → `deep-title`、\n⌘ + クリックで一度に `deep-title`、掘りきったあとのダブルクリックで文言の編集に入る。",...W.parameters?.docs?.description}}},G=[`Default`,`SyncFailed`,`DocumentErrors`,`AbsoluteNode`,`NodeInRotatedBox`,`CompileFailed`,`FileInvalid`,`DeepBranch`]}))();export{I as AbsoluteNode,V as CompileFailed,W as DeepBranch,k as Default,P as DocumentErrors,U as FileInvalid,R as NodeInRotatedBox,A as SyncFailed,G as __namedExportsOrder,O as default};