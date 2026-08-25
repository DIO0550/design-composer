import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-BV6FVPBB.js";import{b as r,g as i,v as a,y as o}from"./editor-top-bar-BZRvG64u.js";import{a as s,c,i as l,n as u,o as d,r as f,s as p,t as m}from"./opened-document-editor-D6yspr_p.js";var h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{t(),a(),r(),c(),d(),l(),u(),{expect:h,screen:g,waitFor:_}=__STORYBOOK_MODULE_TEST__,v=`/work/sample.dcmp`,y=s.create({[v]:f.serialize(o.document(i))}),b={title:`features/editor/OpenedDocumentEditor`,component:m,parameters:{layout:`fullscreen`},args:{clock:p.create().clock,ipc:y.ipc,opened:{path:v,document:o.document(i)}}},x={name:`編集画面`},S={name:`同期に失敗した編集画面`,args:{ipc:s.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:o.document(i)}}},C=o.document(i),w=n.create({components:C.components,artboards:C.artboards,tokens:{...C.tokens,typography:Object.fromEntries(Object.entries(C.tokens.typography).filter(([e])=>e!==`heading`))}}),T={name:`編集で作った不正がある編集画面`,args:{ipc:s.create({[v]:f.serialize(w)}).ipc,opened:{path:v,document:w}}},E=s.create({[v]:f.serialize(o.document(i))}),D={name:`ファイルが不正になった編集画面`,args:{ipc:E.ipc,opened:{path:v,document:o.document(i)}},play:async()=>{await _(()=>{h(E.isWatching(v)).toBe(!0)}),E.changeExternally(v,`{ 壊れた`),await _(()=>{h(g.getByText(`最後に正常だった表示`)).toBeDefined()})}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...x.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SampleEditorState)
    }
  }
}`,...S.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...S.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source},description:{story:`アプリ内の編集で使用中トークンを消したあとの状態（#128）。

このストーリーだけが、ドキュメント由来の一覧と挿入ツールバーが**重ならずに積まれる**
ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。`,...T.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れた編集画面（#135）。**このストーリーだけが 3 ペインの凍結を
一度に映す**（帯の色 / 左ペインの淡色と \`凍結中\` / スクリムとバッジ /
右ペインの「選択は凍結中」）。

開いてから壊すのは、取り込みが**変更の通知**でしか起きないため。壊れた中身で
開き直しても凍結にはならない（それは「開けないファイル」で、別の画面）。

この \`play\` に凍結の見た目を預けている点は弱い。撮影は「同じフレームが 2 回続いたら
採用」なので、\`play\` が間に合わなければ**通常表示がベースラインに焼き付き、しかも
失敗が誰にも見えない**。色・淡色・スクリムはここでしか映らないので、判定そのものは
happy-dom 側（\`opened-document-editor.frozen.test.tsx\`）で確かめている。`,...D.parameters?.docs?.description}}},O=[`Default`,`SyncFailed`,`DocumentErrors`,`FileInvalid`]}))();export{x as Default,T as DocumentErrors,D as FileInvalid,S as SyncFailed,O as __namedExportsOrder,b as default};