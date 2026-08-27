import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,r,t as i}from"./design-document-CZNKcUNl.js";import{d as a}from"./node-resize-CKEMuoIP.js";import{_ as o,a as s,c,l,n as u,o as d,r as f,s as p,t as m,v as h}from"./editor-top-bar-BvPeoBmR.js";function g({tone:e,saveState:t,fileErrors:n,elapsed:r}){return(0,_.jsxs)(m,{tone:e,children:[(0,_.jsx)(m.Breadcrumb,{opened:v}),t?(0,_.jsx)(m.SaveBadge,{state:t}):null,n?(0,_.jsx)(m.FileInvalidBadge,{errors:n}):null,(0,_.jsx)(m.Zoom,{view:a.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}}),r?(0,_.jsx)(m.LastValidRender,{elapsed:r}):null]})}var _,v,y,b,x,S,C,w,T;e((()=>{n(),l(),d(),p(),h(),f(),_=t(),v={path:`/work/settings-ui/app.dcmp`,document:i.createFromTemplate(r.Default)},y={title:`features/editor/EditorTopBar`,component:g,parameters:{layout:`fullscreen`},args:{tone:u.Normal}},b={name:`保存済み`,args:{saveState:c.Saved}},x={name:`保存中`,args:{saveState:c.Saving}},S={name:`保存に失敗`,args:{saveState:c.fromError({kind:`permissionDenied`,message:`/work/settings-ui/app.dcmp: 書き込みが許可されていない`})}},C={name:`最後に正常だった表示を出している状態`,args:{saveState:c.Saved,elapsed:{unit:s.Seconds,count:4}}},w={name:`ファイルが不正`,args:{tone:u.Error,fileErrors:o,elapsed:{unit:s.Seconds,count:4}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "保存済み",
  args: {
    saveState: DocumentSaveState.Saved
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    saveState: DocumentSaveState.Saving
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "保存に失敗",
  args: {
    saveState: DocumentSaveState.fromError({
      kind: "permissionDenied",
      message: "/work/settings-ui/app.dcmp: 書き込みが許可されていない"
    })
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "最後に正常だった表示を出している状態",
  args: {
    saveState: DocumentSaveState.Saved,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...C.parameters?.docs?.source},description:{story:`古さの行だけを出した状態（#183）。帯の色味と保存状態は普段のままなので、
**古さの行と倍率が同じ帯へ並ぶ**ところだけを見られる。

UI 案の Error 画面には倍率が無いが、倍率はファイルにも編集履歴にも触れない表示の操作
なので凍結中も残す（判断は #135）。並びは過渡ではなくこの形で確定している。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正",
  args: {
    tone: EditorTopBarTones.Error,
    fileErrors: SampleFileErrors,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...w.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れている状態（#135）。帯ごと赤へ振れ、保存状態の代わりに
エラーの件数が出る。パンくずも同じ色味へ寄ることと、古さの行が同じ帯に並ぶことを
ここで確かめる（実画面で凍結中に見えるのはこの組み合わせ）。`,...w.parameters?.docs?.description}}},T=[`Saved`,`Saving`,`Failed`,`LastValidRender`,`FileInvalid`]}))();export{S as Failed,w as FileInvalid,C as LastValidRender,b as Saved,x as Saving,T as __namedExportsOrder,y as default};