import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./design-document-YjaXahWS.js";import{n as i,t as a}from"./screen-height-shell-D7M0puoE.js";import{b as o,g as s,v as c,y as l}from"./editor-top-bar-BT9J3o3D.js";import{a as u,c as d,i as f,n as p,o as m,r as h,s as g,t as _}from"./opened-document-editor-B9XojeR5.js";var v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;e((()=>{n(),c(),i(),o(),d(),m(),f(),p(),v=t(),{expect:y,screen:b,waitFor:x}=__STORYBOOK_MODULE_TEST__,S=`/work/sample.dcmp`,C=u.create({[S]:h.serialize(l.document(s))}),w={title:`features/editor/OpenedDocumentEditor`,component:_,parameters:{layout:`fullscreen`},decorators:[e=>(0,v.jsx)(a,{children:(0,v.jsx)(e,{})})],args:{clock:g.create().clock,ipc:C.ipc,opened:{path:S,document:l.document(s)}}},T={name:`編集画面`},E={name:`同期に失敗した編集画面`,args:{ipc:u.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:l.document(s)}}},D=l.document(s),O=r.create({components:D.components,artboards:D.artboards,tokens:{...D.tokens,typography:Object.fromEntries(Object.entries(D.tokens.typography).filter(([e])=>e!==`heading`))}}),k={name:`編集で作った不正がある編集画面`,args:{ipc:u.create({[S]:h.serialize(O)}).ipc,opened:{path:S,document:O}}},A=u.create({[S]:h.serialize(l.document(s))}),j={name:`ファイルが不正になった編集画面`,args:{ipc:A.ipc,opened:{path:S,document:l.document(s)}},play:async()=>{await x(()=>{y(A.isWatching(S)).toBe(!0)}),A.changeExternally(S,`{ 壊れた`),await x(()=>{y(b.getByText(`最後に正常だった表示`)).toBeDefined()})}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
  name: "編集で作った不正がある編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SamplePath]: DocumentJson.serialize(DocumentWithDanglingToken)
    }).ipc,
    opened: {
      path: SamplePath,
      document: DocumentWithDanglingToken
    }
  }
}`,...k.parameters?.docs?.source},description:{story:`アプリ内の編集で使用中トークンを消したあとの状態（#128）。

このストーリーだけが、ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**
ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。`,...k.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を
一度に映す**（帯の色 / 左ペインの淡色と \`凍結中\` / スクリムとバッジ /
右ペインの「選択は凍結中」）。

開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で
開き直しても凍結にはならない（それは「開けないファイル」で、別の画面）。

この \`play\` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら
採用」なので、\`play\` が間に合わなければ**通常表示がベースラインに焼き付き、しかも
失敗が誰にも見えない**。色・淡色・スクリムはここでしか映らないので、判定そのものは
happy-dom 側（\`opened-document-editor.frozen.test.tsx\`）で確かめている。`,...j.parameters?.docs?.description}}},M=[`Default`,`SyncFailed`,`DocumentErrors`,`FileInvalid`]}))();export{T as Default,k as DocumentErrors,j as FileInvalid,E as SyncFailed,M as __namedExportsOrder,w as default};