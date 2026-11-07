import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,t as r}from"./design-document-CG3L177Y.js";import{n as i,t as a}from"./screen-height-shell-B8lrQqp6.js";import{n as o,t as s}from"./file-paths-BkKpprg8.js";import{n as c,t as l}from"./document-json-Ca81p5Z2.js";import{f as u,g as d,h as f,m as p}from"./elapsed-CXn1ZqIK.js";import{a as m,i as h,n as g,o as _,r as v,t as y}from"./opened-document-editor-kFLruTuK.js";import{a as b,i as ee,o as x,r as te,s as S}from"./shown-shortcut-DQy8XHi1.js";async function C(){let e=j(k.getByRole(`region`,{name:`ツリー`})).getByRole(`button`,{name:`home-title`}),t=e.getBoundingClientRect();O.contextMenu(e,{clientX:t.left+t.width/2,clientY:t.bottom}),await A(()=>{D(k.getByRole(`menu`,{name:`コンテキストメニュー`})).toBeDefined()})}function w(e){return r.create({tokens:z.tokens,components:z.components,artboards:z.artboards.map(t=>t.name===`home`?{...t,children:e(t.children)}:t)})}function T(e){return{ipc:v({[M]:l.serialize(e)}).ipc,opened:{path:M,document:e}}}var E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{i(),o(),n(),p(),d(),_(),h(),c(),S(),b(),g(),E=t(),{expect:D,fireEvent:O,screen:k,waitFor:A,within:j}=__STORYBOOK_MODULE_TEST__,M=s(`/work/sample.dcmp`),N=v({[M]:l.serialize(f.document(u))}),P={title:`features/editor/OpenedDocumentEditor`,component:y,parameters:{layout:`fullscreen`},decorators:[e=>(0,E.jsx)(a,{children:(0,E.jsx)(e,{})})],args:{clock:m().clock,ipc:N.ipc,operatingSystem:x.fromNavigator(te),opened:{path:M,document:f.document(u)}}},F={name:`編集画面`},I={name:`同期に失敗した編集画面`,args:{ipc:v({}).ipc,opened:{path:s(`/work/missing.dcmp`),document:f.document(u)}}},L={name:`macOS でコンテキストメニューを開いた編集画面`,play:C},R={name:`Windows でコンテキストメニューを開いた編集画面`,args:{operatingSystem:x.fromNavigator(ee)},play:C},z=f.document(u),B=r.create({tokens:z.tokens,components:z.components,artboards:[{name:`home`,width:360,height:240,props:{layout:`column`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`outer-panel`,type:`Box`,props:{paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`gray-100`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`inner-panel`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[{name:`deep-title`,type:`Text`,props:{content:`ふかい見出し`}}]}]}]}]}),V=r.create({components:z.components,artboards:z.artboards,tokens:{...z.tokens,typography:Object.fromEntries(Object.entries(z.tokens.typography).filter(([e])=>e!==`heading`))}}),H={name:`ドキュメント自身が不正な編集画面`,args:T(V)},U=w(e=>[{name:`home-badge`,type:`Box`,props:{placement:`absolute`,x:296,y:16,widthMode:`fixed`,width:44,heightMode:`fixed`,height:24,background:`primary`,radiusTopLeft:`md`,radiusTopRight:`md`,radiusBottomRight:`md`,radiusBottomLeft:`md`},children:[]},...e]),W={name:`絶対配置のノードがある編集画面`,args:T(U)},G=w(e=>[...e,{name:`home-box`,type:`Box`,props:{placement:`absolute`,x:170,y:70,widthMode:`fixed`,width:160,heightMode:`fixed`,height:80,rotation:90,background:`gray-100`},children:[{name:`home-box-chip`,type:`Box`,props:{placement:`absolute`,x:16,y:16,widthMode:`fixed`,width:40,heightMode:`fixed`,height:20,background:`primary`},children:[]}]}]),K={name:`回った Box の中に絶対配置のノードがある編集画面`,args:T(G)},q={name:`home-login`,ref:`居ない部品`,overrides:{label:`ログイン`}},J=r.create({tokens:z.tokens,components:z.components,artboards:z.artboards.map(e=>({...e,children:e.children.map(e=>e.name===q.name?q:e)}))}),Y={name:`コンパイルできないドキュメントの編集画面`,args:T(J)},X=v({[M]:l.serialize(f.document(u))}),Z={name:`ファイルが不正になった編集画面`,args:{ipc:X.ipc,opened:{path:M,document:f.document(u)}},play:async()=>{await A(()=>{D(X.isWatching(M)).toBe(!0)}),X.changeExternally({path:M,content:`{ 壊れた`}),await A(()=>{D(k.getByText(`最後に正常だった表示`)).toBeDefined()})}},Q={name:`入れ子のあるドキュメントの編集画面`,args:T(B)},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...F.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: createDocumentIpcFake({}).ipc,
    opened: {
      path: filePath("/work/missing.dcmp"),
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...I.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れないので、失敗の帯が編集画
面の上に出る。表示そのものは保たれることをここで確認できる。`,...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "macOS でコンテキストメニューを開いた編集画面",
  play: openContextMenuOnTreeRow
}`,...L.parameters?.docs?.source},description:{story:"macOS で動いているときのノードのメニュー。割り当ては `⌘C` / `Shift+⌘G` の綴りで併記される\n（docs/06-ui.md「コンテキストメニュー」）。",...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "Windows でコンテキストメニューを開いた編集画面",
  args: {
    operatingSystem: OperatingSystem.fromNavigator(WindowsNavigatorPlatform)
  },
  play: openContextMenuOnTreeRow
}`,...R.parameters?.docs?.source},description:{story:"Windows で動いているときのノードのメニュー。割り当ては `Ctrl+C` / `Ctrl+Shift+G` の綴りで\n併記される（docs/06-ui.md「コンテキストメニュー」）。",...R.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "ドキュメント自身が不正な編集画面",
  args: argsOpening(DocumentWithDanglingToken)
}`,...H.parameters?.docs?.source},description:{story:`ドキュメント自身が不正な状態。アプリ内の編集で使用中トークンを消したあとも、その内容が自
動保存されたファイルを開き直した直後も、画面はこれになる。

ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
同じものは \`CompileFailed\` も映すが、あちらはキャンバスが描けない側の絵。`,...H.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithAbsoluteNode)
}`,...W.parameters?.docs?.source},description:{story:`絶対配置のノードが最初から居る編集画面。

\`home-badge\` を運ぶと親の中の座標が動き、\`home-title\` / \`home-login\` を運ぶと
ツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、
ここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。

絶対配置を持ち込むとその意味が変わる。`,...W.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "回った Box の中に絶対配置のノードがある編集画面",
  args: argsOpening(DocumentWithNodeInRotatedBox)
}`,...K.parameters?.docs?.source},description:{story:"回った Box の中に絶対配置のノードがある編集画面。\n\n`home-box-chip` を選んでから運ぶと、祖先だけが回っているノードの座標の置き直しを\n確かめられる（docs/06-ui.md「キャンバス直接操作」）。画面上でポインタが動いた向きへ動き、\n`home-box` の外接矩形の辺へ吸い付き、`home` へ落とすと付け替わる。付け替えると\n`home-box-chip` の向きと座標が書き換わり、画面上の向きと中心は離す直前のまま保たれる。",...K.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "コンパイルできないドキュメントの編集画面",
  args: argsOpening(DocumentWithMissingComponent)
}`,...Y.parameters?.docs?.source},description:{story:`不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
開いた時点から不正でありうるようになったので到達する。

映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
見えると判断ごと間違って読まれる。`,...Y.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
    brokenFiles.changeExternally({
      path: SamplePath,
      content: "{ 壊れた"
    });
    await waitFor(() => {
      expect(screen.getByText("最後に正常だった表示")).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れた編集画面。**このストーリーだけが 3 ペインの凍結を一度に映す**\n（帯の色 / 左ペインの淡色と `凍結中` / スクリムとバッジ / 右ペインの「選択は凍結中」）。\n\nこの `play` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら採\n用」なので、`play` が間に合わなければ**通常表示がベースラインに焼き付き、しかも失敗が\n誰にも見えない**。判定そのものは happy-dom 側で確かめている。",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "入れ子のあるドキュメントの編集画面",
  args: argsOpening(DocumentWithDeepBranch)
}`,...Q.parameters?.docs?.source},description:{story:"入れ子が 3 階層あるドキュメントを開いた編集画面。\n\nキャンバスのクリックが選ぶ階層（docs/06-ui.md）を操作して確かめるためのストーリー。\nクリックで `outer-panel`、ダブルクリックを重ねて `inner-panel` → `deep-title`、\n⌘ + クリックで一度に `deep-title`、掘りきったあとのダブルクリックで文言の編集に入る。",...Q.parameters?.docs?.description}}},$=[`Default`,`SyncFailed`,`ContextMenuOnMacOs`,`ContextMenuOnWindows`,`DocumentErrors`,`AbsoluteNode`,`NodeInRotatedBox`,`CompileFailed`,`FileInvalid`,`DeepBranch`]}))();export{W as AbsoluteNode,Y as CompileFailed,L as ContextMenuOnMacOs,R as ContextMenuOnWindows,Q as DeepBranch,F as Default,H as DocumentErrors,Z as FileInvalid,K as NodeInRotatedBox,I as SyncFailed,$ as __namedExportsOrder,P as default};