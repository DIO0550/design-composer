import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-B-7AsI0c.js";import{t as i}from"./jsx-runtime-4HHWW5MW.js";import{a,i as o}from"./sample-editor-state-DjG_EzGl.js";import{n as s,r as c}from"./canvas-view-ByvdK-yY.js";import{a as l,c as u,n as d,o as f,r as p,s as m,t as h}from"./editor-top-bar-D9qbh-RG.js";function g({tone:e,saveState:t,fileErrors:n,elapsed:r}){return(0,_.jsxs)(h,{tone:e,children:[(0,_.jsx)(h.Breadcrumb,{opened:v}),t?(0,_.jsx)(h.SaveBadge,{state:t}):null,n?(0,_.jsx)(h.FileInvalidBadge,{errors:n}):null,(0,_.jsx)(h.Zoom,{view:s.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}}),r?(0,_.jsx)(h.LastValidRender,{elapsed:r}):null]})}var _,v,y,b,x,S,C,w,T;e((()=>{t(),u(),f(),a(),c(),p(),_=i(),v={path:`/work/settings-ui/app.dcmp`,document:r.createFromTemplate(n.Default)},y={title:`features/editor/EditorTopBar`,component:g,parameters:{layout:`fullscreen`},args:{tone:d.Normal}},b={name:`保存済み`,args:{saveState:m.Saved}},x={name:`保存中`,args:{saveState:m.Saving}},S={name:`保存に失敗`,args:{saveState:m.fromError({kind:`permissionDenied`,message:`/work/settings-ui/app.dcmp: 書き込みが許可されていない`})}},C={name:`最後に正常だった表示を出している状態`,args:{saveState:m.Saved,elapsed:{unit:l.Seconds,count:4}}},w={name:`ファイルが不正`,args:{tone:d.Error,fileErrors:o,elapsed:{unit:l.Seconds,count:4}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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