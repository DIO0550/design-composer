import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./design-document-YjaXahWS.js";import{b as i,g as a,v as o,y as s}from"./editor-top-bar-DzmbsNfg.js";import{a as c,c as l,i as u,n as d,o as f,r as p,s as m,t as h}from"./opened-document-editor-C5HaU6GA.js";var g,_,v,y,b,x,S,C,w,T,E,D,O,k,A;e((()=>{n(),o(),i(),l(),f(),u(),d(),g=t(),{expect:_,screen:v,waitFor:y}=__STORYBOOK_MODULE_TEST__,b=`/work/sample.dcmp`,x=c.create({[b]:p.serialize(s.document(a))}),S={title:`features/editor/OpenedDocumentEditor`,component:h,parameters:{layout:`fullscreen`},decorators:[e=>(0,g.jsx)(`div`,{className:`h-screen`,children:(0,g.jsx)(e,{})})],args:{clock:m.create().clock,ipc:x.ipc,opened:{path:b,document:s.document(a)}}},C={name:`編集画面`},w={name:`同期に失敗した編集画面`,args:{ipc:c.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:s.document(a)}}},T=s.document(a),E=r.create({components:T.components,artboards:T.artboards,tokens:{...T.tokens,typography:Object.fromEntries(Object.entries(T.tokens.typography).filter(([e])=>e!==`heading`))}}),D={name:`編集で作った不正がある編集画面`,args:{ipc:c.create({[b]:p.serialize(E)}).ipc,opened:{path:b,document:E}}},O=c.create({[b]:p.serialize(s.document(a))}),k={name:`ファイルが不正になった編集画面`,args:{ipc:O.ipc,opened:{path:b,document:s.document(a)}},play:async()=>{await y(()=>{_(O.isWatching(b)).toBe(!0)}),O.changeExternally(b,`{ 壊れた`),await y(()=>{_(v.getByText(`最後に正常だった表示`)).toBeDefined()})}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...C.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...w.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...w.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source},description:{story:`アプリ内の編集で使用中トークンを消したあとの状態（#128）。

このストーリーだけが、ドキュメント由来の一覧とキャンバスのツールバーが**重ならずに積まれる**
ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。`,...D.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を
一度に映す**（帯の色 / 左ペインの淡色と \`凍結中\` / スクリムとバッジ /
右ペインの「選択は凍結中」）。

開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で
開き直しても凍結にはならない（それは「開けないファイル」で、別の画面）。

この \`play\` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら
採用」なので、\`play\` が間に合わなければ**通常表示がベースラインに焼き付き、しかも
失敗が誰にも見えない**。色・淡色・スクリムはここでしか映らないので、判定そのものは
happy-dom 側（\`opened-document-editor.frozen.test.tsx\`）で確かめている。`,...k.parameters?.docs?.description}}},A=[`Default`,`SyncFailed`,`DocumentErrors`,`FileInvalid`]}))();export{C as Default,D as DocumentErrors,k as FileInvalid,w as SyncFailed,A as __namedExportsOrder,S as default};