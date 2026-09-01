import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./design-document-DyhxCh3S.js";import{n as i,t as a}from"./screen-height-shell-D7M0puoE.js";import{_ as o,b as s,x as c,y as l}from"./editor-top-bar-DJi1Xaou.js";import{a as u,i as d,l as f,n as p,o as m,r as h,t as g,u as _}from"./opened-document-editor-BbVRM7qI.js";var v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L;e((()=>{n(),l(),i(),c(),_(),m(),d(),p(),v=t(),{expect:y,screen:b,waitFor:x}=__STORYBOOK_MODULE_TEST__,S=`/work/sample.dcmp`,C=u.create({[S]:h.serialize(s.document(o))}),w={title:`features/editor/OpenedDocumentEditor`,component:g,parameters:{layout:`fullscreen`},decorators:[e=>(0,v.jsx)(a,{children:(0,v.jsx)(e,{})})],args:{clock:f.create().clock,ipc:C.ipc,opened:{path:S,document:s.document(o)}}},T={name:`編集画面`},E={name:`同期に失敗した編集画面`,args:{ipc:u.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:s.document(o)}}},D=s.document(o),O=r.create({components:D.components,artboards:D.artboards,tokens:{...D.tokens,typography:Object.fromEntries(Object.entries(D.tokens.typography).filter(([e])=>e!==`heading`))}}),k={name:`ドキュメント自身が不正な編集画面`,args:{ipc:u.create({[S]:h.serialize(O)}).ipc,opened:{path:S,document:O}}},A=r.create({tokens:D.tokens,components:D.components,artboards:D.artboards.map(e=>e.name===`home`?{...e,children:[{name:`home-badge`,type:`Box`,props:{placement:`absolute`,x:296,y:16,widthMode:`fixed`,width:44,heightMode:`fixed`,height:24,background:`primary`,radius:`md`},children:[]},...e.children]}:e)}),j={name:`絶対配置のノードがある編集画面`,args:{ipc:u.create({[S]:h.serialize(A)}).ipc,opened:{path:S,document:A}}},M={name:`home-login`,ref:`居ない部品`,overrides:{label:`ログイン`}},N=r.create({tokens:D.tokens,components:D.components,artboards:D.artboards.map(e=>({...e,children:e.children.map(e=>e.name===M.name?M:e)}))}),P={name:`コンパイルできないドキュメントの編集画面`,args:{ipc:u.create({[S]:h.serialize(N)}).ipc,opened:{path:S,document:N}}},F=u.create({[S]:h.serialize(s.document(o))}),I={name:`ファイルが不正になった編集画面`,args:{ipc:F.ipc,opened:{path:S,document:s.document(o)}},play:async()=>{await x(()=>{y(F.isWatching(S)).toBe(!0)}),F.changeExternally(S,`{ 壊れた`),await x(()=>{y(b.getByText(`最後に正常だった表示`)).toBeDefined()})}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...E.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source},description:{story:`ドキュメント自身が不正な状態（#128）。アプリ内の編集で使用中トークンを消したあとも、
その内容が自動保存されたファイルを開き直した直後も、画面はこれになる（#158）。

ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**ことを映す
（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。
同じものは \`CompileFailed\` も映すが、あちらはキャンバスが描けない側の絵。`,...k.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source},description:{story:"絶対配置のノードが最初から居る編集画面（#379 / #381）。\n\n`home-badge` を運ぶと親の中の座標が動き、`home-title` / `home-login` を運ぶと\nツリーの並びが変わる。**同じドラッグが配置によって別の意味になる**ところを、\nここで実際に掴んで確認できる（運んでいる間、座標の側にはドロップ線が出ない）。\n\n`Default` に足さずに別の story にしているのは、あちらのベースライン 1 本が\n「ふつうの編集画面」を指しているため。絶対配置を持ち込むとその意味が変わる。",...j.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source},description:{story:`不正のうち**描画そのものが成立しない**もの（循環参照・居ない部品への参照）を開いた状態。
開いた時点から不正でありうるようになったので到達する（#158）。

映すのは、キャンバスがコンパイルの失敗 1 行になっても**左右のペインとエラー一覧は
生きている**こと。これが「不正でも開く」を成り立たせている前提で、ここが凍って
見えると判断ごと間違って読まれる。`,...P.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を
一度に映す**（帯の色 / 左ペインの淡色と \`凍結中\` / スクリムとバッジ /
右ペインの「選択は凍結中」）。

開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で開き直しても
凍結にはならない（解釈できなければ開始画面、スキーマ検証だけなら \`DocumentErrors\` の絵）。

この \`play\` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら
採用」なので、\`play\` が間に合わなければ**通常表示がベースラインに焼き付き、しかも
失敗が誰にも見えない**。色・淡色・スクリムはここでしか映らないので、判定そのものは
happy-dom 側（\`opened-document-editor.frozen.test.tsx\`）で確かめている。`,...I.parameters?.docs?.description}}},L=[`Default`,`SyncFailed`,`DocumentErrors`,`AbsoluteNode`,`CompileFailed`,`FileInvalid`]}))();export{j as AbsoluteNode,P as CompileFailed,T as Default,k as DocumentErrors,I as FileInvalid,E as SyncFailed,L as __namedExportsOrder,w as default};