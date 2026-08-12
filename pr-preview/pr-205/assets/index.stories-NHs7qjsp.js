import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-B-4r0qA3.js";import{a as r,i,n as a,r as o}from"./sample-editor-state-BpoyTnU0.js";import{f as s,p as c}from"./elapsed-D8kHTRvs.js";import{a as l,i as u,n as d,o as f,r as p,t as m}from"./opened-document-editor-BBLJhLpG.js";var h,g,_,v,y,b,x,S,C;e((()=>{t(),o(),r(),f(),u(),c(),d(),h=`/work/sample.dcmp`,g=p.create({[h]:s.serialize(i.document(a))}),_={title:`features/editor/OpenedDocumentEditor`,component:m,parameters:{layout:`fullscreen`},args:{clock:l.create().clock,ipc:g.ipc,opened:{path:h,document:i.document(a)}}},v={name:`編集画面`},y={name:`同期に失敗した編集画面`,args:{ipc:p.create({}).ipc,opened:{path:`/work/missing.dcmp`,document:i.document(a)}}},b=i.document(a),x=n.create({components:b.components,artboards:b.artboards,tokens:{...b.tokens,typography:Object.fromEntries(Object.entries(b.tokens.typography).filter(([e])=>e!==`heading`))}}),S={name:`編集で作った不正がある編集画面`,args:{ipc:p.create({[h]:s.serialize(x)}).ipc,opened:{path:h,document:x}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "編集画面"
}`,...v.parameters?.docs?.source},description:{story:`3 ペインを組み立てた編集画面。EditorProvider を内側に持つため、
ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "同期に失敗した編集画面",
  args: {
    ipc: DocumentIpcFake.create({}).ipc,
    opened: {
      path: "/work/missing.dcmp",
      document: EditorState.document(SAMPLE_EDITOR_STATE)
    }
  }
}`,...y.parameters?.docs?.source},description:{story:`ファイルとの同期に失敗している状態。実体の無いパスは監視を張れない（#30）ので、
失敗の帯が編集画面の上に出る。表示そのものは保たれることをここで確認できる。`,...y.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source},description:{story:`アプリ内の編集で使用中トークンを消したあとの状態（#128）。

このストーリーだけが、ドキュメント由来の一覧と挿入ツールバーが**重ならずに積まれる**
ことを映す（部品単体のストーリーにはツールバーが居ないため、重なりが誰にも見えない）。`,...S.parameters?.docs?.description}}},C=[`Default`,`SyncFailed`,`DocumentErrors`]}))();export{v as Default,S as DocumentErrors,y as SyncFailed,C as __namedExportsOrder,_ as default};