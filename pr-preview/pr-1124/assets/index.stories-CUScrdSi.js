import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./design-document-4IL9Dtre.js";import{n as i,t as a}from"./screen-height-shell-B8lrQqp6.js";import{n as o,t as s}from"./document-json-g-c5wODW.js";import{f as c,g as l,h as u,m as d}from"./elapsed-CuMAAqeV.js";import{a as f,i as p,n as m,o as h,r as g,t as _}from"./opened-document-editor-BJO8vRvI.js";function v(e){return r.create({tokens:k.tokens,components:k.components,artboards:k.artboards.map(t=>t.name===`home`?{...t,children:e(t.children)}:t)})}function y(e){return{ipc:g.create({[w]:s.serialize(e)}).ipc,opened:{path:w,document:e}}}var b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U;e((()=>{i(),n(),d(),l(),h(),p(),o(),m(),b=t(),{expect:x,screen:S,waitFor:C}=__STORYBOOK_MODULE_TEST__,w=`/work/sample.dcmp`,T=g.create({[w]:s.serialize(u.document(c))}),E={title:`features/editor/OpenedDocumentEditor`,component:_,parameters:{layout:`fullscreen`},decorators:[e=>(0,b.jsx)(a,{children:(0,b.jsx)(e,{})})],args:{clock:f.create().clock,ipc:T.ipc,opened:{path:w,document:u.document(c)}}},D={name:`編集画面`},O={name:`同期に失敗した編集画面`,args:{ipc:g.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:u.document(c)}}},k=u.document(c),A=r.create({tokens:k.tokens,components:k.components,artboards:[{name:`home`,width:360,height:240,props:{layout:`column`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`outer-panel`,type:`Box`,props:{paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`gray-100`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`inner-panel`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`deep-title`,type:`Text`,props:{content:`ふかい見出し`}}]}]}]}]}),j=r.create({components:k.components,artboards:k.artboards,tokens:{...k.tokens,typography:Object.fromEntries(Object.entries(k.tokens.typography).filter(([e])=>e!==`heading`))}}),M={name:`ドキュメント自身が不正な編集画面`,args:y(j)},N=v(e=>[{name:`home-badge`,type:`Box`,props:{placement:`absolute`,x:296,y:16,widthMode:`fixed`,width:44,heightMode:`fixed`,height:24,background:`primary`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[]},...e]),P={name:`絶対配置のノードがある編集画面`,args:y(N)},F=v(e=>[...e,{name:`home-box`,type:`Box`,props:{placement:`absolute`,x:170,y:70,widthMode:`fixed`,width:160,heightMode:`fixed`,height:80,rotation:90,background:`gray-100`},children:[{name:`home-box-chip`,type:`Box`,props:{placement:`absolute`,x:16,y:16,widthMode:`fixed`,width:40,heightMode:`fixed`,height:20,background:`primary`},children:[]}]}]),I={name:`回った Box の中に絶対配置のノードがある編集画面`,args:y(F)},L={name:`home-login`,ref:`居ない部品`,overrides:{label:`ログイン`}},R=r.create({tokens:k.tokens,components:k.components,artboards:k.artboards.map(e=>({...e,children:e.children.map(e=>e.name===L.name?L:e)}))}),z={name:`コンパイルできないドキュメントの編集画面`,args:y(R)},B=g.create({[w]:s.serialize(u.document(c))}),V={name:`ファイルが不正になった編集画面`,args:{ipc:B.ipc,opened:{path:w,document:u.document(c)}},play:async()=>{await C(()=>{x(B.isWatching(w)).toBe(!0)}),B.changeExternally(w,`{ 壊れた`),await C(()=>{x(S.getByText(`最後に正常だった表示`)).toBeDefined()})}},H={name:`入れ子のあるドキュメントの編集画面`,args:y(A)},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...D.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...O.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れないので、失敗の帯が編集画
面の上に出る。表示そのものは保たれることをここで確認できる。`,...O.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "ドキュメント自身が不正な編集画面",
  args: argsOpening(DocumentWithDanglingToken)
}`,...M.parameters?.docs?.source},description:{story:`ドキュメント自身が不正な状態。アプリ内の編集で使用中トークンを消したあとも、その内容が自
動保存されたファイルを開き直した直後も、画面はこれになる。

ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
同じものは \`CompileFailed\` も映すが、あちらはキャンバスが描けない側の絵。`,...M.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithAbsoluteNode)
}`,...P.parameters?.docs?.source},description:{story:`絶対配置のノードが最初から居る編集画面。

\`home-badge\` を運ぶと親の中の座標が動き、\`home-title\` / \`home-login\` を運ぶと
ツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、
ここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。

絶対配置を持ち込むとその意味が変わる。`,...P.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "回った Box の中に絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithNodeInRotatedBox)
}`,...I.parameters?.docs?.source},description:{story:"回った Box の中に絶対配置のノードがある編集画面。\n\n`home-box-chip` を選んでから運ぶと、祖先だけが回っているノードの座標の置き直しを\n確かめられる（docs/06-ui.md「キャンバス直接操作」）。画面上でポインタが動いた向きへ動き、\n`home-box` の外接矩形の辺へ吸い付き、`home` へ落とすと付け替わる。付け替えると\n`home-box-chip` の向きと座標が書き換わり、画面上の向きと中心は離す直前のまま保たれる。",...I.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "コンパイルできないドキュメントの編集画面",
  args: argsOpening(DocumentWithMissingComponent)
}`,...z.parameters?.docs?.source},description:{story:`不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
開いた時点から不正でありうるようになったので到達する。

映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
見えると判断ごと間違って読まれる。`,...z.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れた編集画面。**このストーリーだけが 3 ペインの凍結を一度に映す**\n（帯の色 / 左ペインの淡色と `凍結中` / スクリムとバッジ / 右ペインの「選択は凍結中」）。\n\nこの `play` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら採\n用」なので、`play` が間に合わなければ**通常表示がベースラインに焼き付き、しかも失敗が\n誰にも見えない**。判定そのものは happy-dom 側で確かめている。",...V.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "入れ子のあるドキュメントの編集画面",
  args: argsOpening(DocumentWithDeepBranch)
}`,...H.parameters?.docs?.source},description:{story:"入れ子が 3 階層あるドキュメントを開いた編集画面。\n\nキャンバスのクリックが選ぶ階層（docs/06-ui.md）を操作して確かめるためのストーリー。\nクリックで `outer-panel`、ダブルクリックを重ねて `inner-panel` → `deep-title`、\n⌘ + クリックで一度に `deep-title`、掘りきったあとのダブルクリックで文言の編集に入る。",...H.parameters?.docs?.description}}},U=[`Default`,`SyncFailed`,`DocumentErrors`,`AbsoluteNode`,`NodeInRotatedBox`,`CompileFailed`,`FileInvalid`,`DeepBranch`]}))();export{P as AbsoluteNode,z as CompileFailed,H as DeepBranch,D as Default,M as DocumentErrors,V as FileInvalid,I as NodeInRotatedBox,O as SyncFailed,U as __namedExportsOrder,E as default};