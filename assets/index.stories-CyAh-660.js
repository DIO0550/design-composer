import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-DpH29z2I.js";import{a,c as o,n as s,o as c,s as l,t as u}from"./opened-document-editor-B5AO6PYt.js";var d,f,p,m,h;e((()=>{i(),t(),o(),c(),s(),d=`/work/sample.dcmp`,f={title:`features/editor/OpenedDocumentEditor`,component:u,parameters:{layout:`fullscreen`},args:{ipc:l.create({[d]:a.serialize(n.document(r))}).ipc,opened:{path:d,document:n.document(r)}}},p={name:`編集画面`},m={name:`同期に失敗した編集画面`,args:{ipc:l.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:n.document(r)}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...p.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SAMPLE_EDITOR_STATE)
    }
  }
}`,...m.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...m.parameters?.docs?.description}}},h=[`Default`,`SyncFailed`]}))();export{p as Default,m as SyncFailed,h as __namedExportsOrder,f as default};