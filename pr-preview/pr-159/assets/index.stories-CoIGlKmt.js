import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-CuauvRgR.js";import{a as r,i,n as a,r as o}from"./sample-editor-state-0TS5S1Do.js";import{a as s,c,n as l,o as u,s as d,t as f}from"./opened-document-editor-DjP4Ty8f.js";var p,m,h,g,_,v,y,b;e((()=>{t(),o(),r(),c(),u(),l(),p=`/work/sample.dcmp`,m={title:`features/editor/OpenedDocumentEditor`,component:f,parameters:{layout:`fullscreen`},args:{ipc:d.create({[p]:s.serialize(i.document(a))}).ipc,opened:{path:p,document:i.document(a)}}},h={name:`編集画面`},g={name:`同期に失敗した編集画面`,args:{ipc:d.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:i.document(a)}}},_=i.document(a),v=n.create({components:_.components,artboards:_.artboards,tokens:{..._.tokens,typography:Object.fromEntries(Object.entries(_.tokens.typography).filter(([e])=>e!==`heading`))}}),y={name:`編集で作った不正がある編集画面`,args:{ipc:d.create({[p]:s.serialize(v)}).ipc,opened:{path:p,document:v}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...h.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SAMPLE_EDITOR_STATE)
    }
  }
}`,...g.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...g.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "編集で作った不正がある編集画面",
  args: {
    ipc: DocumentIpcFake.create({
      [SAMPLE_PATH]: DocumentJson.serialize(DOCUMENT_WITH_DANGLING_TOKEN)
    }).ipc,
    opened: {
      path: SAMPLE_PATH,
      document: DOCUMENT_WITH_DANGLING_TOKEN
    }
  }
}`,...y.parameters?.docs?.source},description:{story:`アプリ内の編集で使用中トークンを消したあとの状態（#128）。

このストーリーだけが、ドキュメント由来の一覧と挿入ツールバーが**重ならずに積まれる**
ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。`,...y.parameters?.docs?.description}}},b=[`Default`,`SyncFailed`,`DocumentErrors`]}))();export{h as Default,y as DocumentErrors,g as SyncFailed,b as __namedExportsOrder,m as default};