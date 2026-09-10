import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./design-document-ecUBO5Gq.js";import{n as i,t as a}from"./screen-height-shell-BtLX1gKV.js";import{n as o,t as s}from"./document-json-BGP6q7Sg.js";import{f as c,g as l,h as u,m as d}from"./editor-top-bar-DFPAXqGZ.js";import{a as f,i as p,n as m,o as h,r as g,t as _}from"./opened-document-editor-8wuntkBB.js";var v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z;e((()=>{i(),n(),d(),l(),h(),p(),o(),m(),v=t(),{expect:y,screen:b,waitFor:x}=__STORYBOOK_MODULE_TEST__,S=`/work/sample.dcmp`,C=g.create({[S]:s.serialize(u.document(c))}),w={title:`features/editor/OpenedDocumentEditor`,component:_,parameters:{layout:`fullscreen`},decorators:[e=>(0,v.jsx)(a,{children:(0,v.jsx)(e,{})})],args:{clock:f.create().clock,ipc:C.ipc,opened:{path:S,document:u.document(c)}}},T={name:`編集画面`},E={name:`同期に失敗した編集画面`,args:{ipc:g.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:u.document(c)}}},D=u.document(c),O=r.create({tokens:D.tokens,components:D.components,artboards:[{name:`home`,width:360,height:240,props:{layout:`column`,paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`white`},children:[{name:`outer-panel`,type:`Box`,props:{paddingTop:`lg`,paddingRight:`lg`,paddingBottom:`lg`,paddingLeft:`lg`,background:`gray-100`,radius:`md`},children:[{name:`inner-panel`,type:`Box`,props:{paddingTop:`md`,paddingRight:`md`,paddingBottom:`md`,paddingLeft:`md`,background:`white`,radius:`md`},children:[{name:`deep-title`,type:`Text`,props:{content:`ふかい見出し`}}]}]}]}]}),k=r.create({components:D.components,artboards:D.artboards,tokens:{...D.tokens,typography:Object.fromEntries(Object.entries(D.tokens.typography).filter(([e])=>e!==`heading`))}}),A={name:`ドキュメント自身が不正な編集画面`,args:{ipc:g.create({[S]:s.serialize(k)}).ipc,opened:{path:S,document:k}}},j=r.create({tokens:D.tokens,components:D.components,artboards:D.artboards.map(e=>e.name===`home`?{...e,children:[{name:`home-badge`,type:`Box`,props:{placement:`absolute`,x:296,y:16,widthMode:`fixed`,width:44,heightMode:`fixed`,height:24,background:`primary`,radius:`md`},children:[]},...e.children]}:e)}),M={name:`絶対配置のノードがある編集画面`,args:{ipc:g.create({[S]:s.serialize(j)}).ipc,opened:{path:S,document:j}}},N={name:`home-login`,ref:`居ない部品`,overrides:{label:`ログイン`}},P=r.create({tokens:D.tokens,components:D.components,artboards:D.artboards.map(e=>({...e,children:e.children.map(e=>e.name===N.name?N:e)}))}),F={name:`コンパイルできないドキュメントの編集画面`,args:{ipc:g.create({[S]:s.serialize(P)}).ipc,opened:{path:S,document:P}}},I=g.create({[S]:s.serialize(u.document(c))}),L={name:`ファイルが不正になった編集画面`,args:{ipc:I.ipc,opened:{path:S,document:u.document(c)}},play:async()=>{await x(()=>{y(I.isWatching(S)).toBe(!0)}),I.changeExternally(S,`{ 壊れた`),await x(()=>{y(b.getByText(`最後に正常だった表示`)).toBeDefined()})}},R={name:`入れ子のあるドキュメントの編集画面`,args:{ipc:g.create({[S]:s.serialize(O)}).ipc,opened:{path:S,document:O}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...T.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...E.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...E.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "ドキュメント自身が不正な編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithDanglingToken)
    }).ipc,
    opened: {
      path: SamplePath,
      document: DocumentWithDanglingToken
    }
  }
}`,...A.parameters?.docs?.source},description:{story:`ドキュメント自身が不正な状態（#128）。アプリ内の編集で使用中トークンを消したあとも、
その内容が自動保存されたファイルを開き直した直後も、画面はこれになる（#158）。

ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
同じものは \`CompileFailed\` も映すが、あちらはキャンバスが描けない側の絵。`,...A.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "絶対配置のノードがある編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithAbsoluteNode)
    }).ipc,
    opened: {
      path: SamplePath,
      document: DocumentWithAbsoluteNode
    }
  }
}`,...M.parameters?.docs?.source},description:{story:"絶対配置のノードが最初から居る編集画面（#379 / #381）。\n\n`home-badge` を運ぶと親の中の座標が動き、`home-title` / `home-login` を運ぶと\nツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、\nここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。\n\n`Default` に足さずに別の story にしているのは、あちらのベースライン 1 本が\n「ふつうの編集画面」を指しているため。絶対配置を持ち込むとその意味が変わる。",...M.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "コンパイルできないドキュメントの編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithMissingComponent)
    }).ipc,
    opened: {
      path: SamplePath,
      document: DocumentWithMissingComponent
    }
  }
}`,...F.parameters?.docs?.source},description:{story:`不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
開いた時点から不正でありうるようになったので到達する（#158）。

映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
見えると判断ごと間違って読まれる。`,...F.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を一
度に映す**（帯の色 / 左ペインの淡色と \`凍結中\` / スクリムとバッジ / 右ペインの「選択
は凍結中」）。

開いてから壊すのは、取り込みが**変更の通知**でしか起きないため（壊れた中身で開き直し
ても凍結にはならない）。

この \`play\` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら採
用」なので、\`play\` が間に合わなければ**通常表示がベースラインに焼き付き、しかも失敗が
誰にも見えない**。判定そのものは happy-dom 側で確かめている。`,...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "入れ子のあるドキュメントの編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithDeepBranch)
    }).ipc,
    opened: {
      path: SamplePath,
      document: DocumentWithDeepBranch
    }
  }
}`,...R.parameters?.docs?.source},description:{story:"入れ子が 3 階層あるドキュメントを開いた編集画面。\n\nキャンバスのクリックが選ぶ階層（docs/06-ui.md）を操作して確かめるためのストーリー。\nクリックで `outer-panel`、ダブルクリックを重ねて `inner-panel` → `deep-title`、\n⌘ + クリックで一度に `deep-title`、掘りきったあとのダブルクリックで文言の編集に入る。",...R.parameters?.docs?.description}}},z=[`Default`,`SyncFailed`,`DocumentErrors`,`AbsoluteNode`,`CompileFailed`,`FileInvalid`,`DeepBranch`]}))();export{M as AbsoluteNode,F as CompileFailed,R as DeepBranch,T as Default,A as DocumentErrors,L as FileInvalid,E as SyncFailed,z as __namedExportsOrder,w as default};