import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,r,t as i}from"./design-document-BCCGVsiu.js";import{d as a}from"./node-resize-BliCNZ8T.js";import{a as o,c as s,f as c,l,m as u,n as d,o as f,p,r as m,s as h,t as g,v as _,y as v}from"./editor-top-bar-CEHPE4ez.js";function y({tone:e,saveState:t,fileErrors:n,elapsed:r}){return(0,b.jsxs)(g,{tone:e,children:[(0,b.jsx)(g.Breadcrumb,{opened:x}),t?(0,b.jsx)(g.SaveBadge,{state:t}):null,n?(0,b.jsx)(g.FileInvalidBadge,{errors:n}):null,(0,b.jsx)(g.Zoom,{view:a.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}}),r?(0,b.jsx)(g.LastValidRender,{elapsed:r}):null]})}var b,x,S,C,w,T,E,D,O;e((()=>{n(),u(),l(),f(),h(),v(),m(),b=t(),x={path:`/work/settings-ui/app.dcmp`,document:i.createFromTemplate(r.Default)},S={title:`features/editor/EditorTopBar`,component:y,parameters:{layout:`fullscreen`},args:{tone:d.Normal}},C={name:`保存済み`,args:{saveState:s.Saved}},w={name:`保存中`,args:{saveState:s.Saving}},T={name:`保存に失敗`,args:{saveState:s.failed(c.create(p.NotPermitted,`/work/settings-ui/app.dcmp: 書き込みが許可されていない`))}},E={name:`最後に正常だった表示を出している状態`,args:{saveState:s.Saved,elapsed:{unit:o.Seconds,count:4}}},D={name:`ファイルが不正`,args:{tone:d.Error,fileErrors:_,elapsed:{unit:o.Seconds,count:4}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "保存済み",
  args: {
    saveState: DocumentSaveState.Saved
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    saveState: DocumentSaveState.Saving
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "保存に失敗",
  args: {
    saveState: DocumentSaveState.failed(DocumentAccessFailure.create(DocumentAccessFailureReasons.NotPermitted, "/work/settings-ui/app.dcmp: 書き込みが許可されていない"))
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "最後に正常だった表示を出している状態",
  args: {
    saveState: DocumentSaveState.Saved,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...E.parameters?.docs?.source},description:{story:`古さの行だけを出した状態（#183）。帯の色味と保存状態は普段のままなので、
**古さの行と倍率が同じ帯へ並ぶ**ところだけを見られる。

UI 案の Error 画面には倍率が無いが、倍率はファイルにも編集履歴にも触れない表示の操作
なので凍結中も残す（判断は #135）。並びは過渡ではなくこの形で確定している。`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正",
  args: {
    tone: EditorTopBarTones.Error,
    fileErrors: SampleFileErrors,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...D.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れている状態（#135）。帯ごと赤へ振れ、保存状態の代わりに
エラーの件数が出る。パンくずも同じ色味へ寄ることと、古さの行が同じ帯に並ぶことを
ここで確かめる（実画面で凍結中に見えるのはこの組み合わせ）。`,...D.parameters?.docs?.description}}},O=[`Saved`,`Saving`,`Failed`,`LastValidRender`,`FileInvalid`]}))();export{T as Failed,D as FileInvalid,E as LastValidRender,C as Saved,w as Saving,O as __namedExportsOrder,S as default};