import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n}from"./sample-editor-state-5UaIiKNi.js";import{a as r,c as i,n as a,o,s,t as c}from"./opened-document-editor-Cc58dgTY.js";var l,u,d,f,p;e((()=>{n(),i(),o(),a(),l=`/work/sample.dcmp`,u={title:`features/editor/OpenedDocumentEditor`,component:c,parameters:{layout:`fullscreen`},args:{ipc:s.create({[l]:r.serialize(t.document)}).ipc,opened:{path:l,document:t.document}}},d={name:`編集画面`},f={name:`同期に失敗した編集画面`,args:{ipc:s.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:t.document}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...d.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: SAMPLE_EDITOR_STATE.document
    }
  }
}`,...f.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...f.parameters?.docs?.description}}},p=[`Default`,`SyncFailed`]}))();export{d as Default,f as SyncFailed,p as __namedExportsOrder,u as default};