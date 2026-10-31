import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{n,r,t as i}from"./design-document-DEJ6TNtP.js";import{n as a,t as o}from"./file-paths-C0jg4qUK.js";import{a as s,c,i as l,l as u,m as d,n as f,o as p,p as m,r as h,s as g}from"./elapsed-B7dQJRd6.js";import{n as _,r as v,t as y}from"./document-access-failure-BTcZWHfT.js";import{l as b}from"./side-snap-DPsTyUUX.js";function x({tone:e,saveState:t,fileErrors:n,elapsed:r}){return(0,S.jsxs)(l,{tone:e,children:[(0,S.jsx)(l.Breadcrumb,{opened:C}),t?(0,S.jsx)(l.SaveBadge,{state:t}):null,n?(0,S.jsx)(l.FileInvalidBadge,{errors:n}):null,(0,S.jsx)(l.Zoom,{view:b.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}}),r?(0,S.jsx)(l.LastValidRender,{elapsed:r}):null]})}var S,C,w,T,E,D,O,k,A;e((()=>{a(),n(),v(),u(),h(),d(),g(),p(),S=t(),C={path:o(`/work/settings-ui/app.dcmp`),document:i.createFromTemplate(r.Default)},w={title:`features/editor/EditorTopBar`,component:x,parameters:{layout:`fullscreen`},args:{tone:s.Normal}},T={name:`保存済み`,args:{saveState:c.Saved}},E={name:`保存中`,args:{saveState:c.Saving}},D={name:`保存に失敗`,args:{saveState:c.failed(y.create(_.NotPermitted,`/work/settings-ui/app.dcmp: 書き込みが許可されていない`))}},O={name:`最後に正常だった表示を出している状態`,args:{saveState:c.Saved,elapsed:{unit:f.Seconds,count:4}}},k={name:`ファイルが不正`,args:{tone:s.Error,fileErrors:m,elapsed:{unit:f.Seconds,count:4}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "保存済み",
  args: {
    saveState: DocumentSaveState.Saved
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    saveState: DocumentSaveState.Saving
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "保存に失敗",
  args: {
    saveState: DocumentSaveState.failed(DocumentAccessFailure.create(DocumentAccessFailureReasons.NotPermitted, "/work/settings-ui/app.dcmp: 書き込みが許可されていない"))
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "最後に正常だった表示を出している状態",
  args: {
    saveState: DocumentSaveState.Saved,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...O.parameters?.docs?.source},description:{story:`古さの行だけを出した状態。帯の色味と保存状態は普段のままなので、**古さの行と倍率が同じ帯
へ並ぶ**ところだけを見られる。

UI 案の Error 画面には倍率が無いが、倍率はファイルにも編集履歴にも触れない表示の操作なの
で凍結中も残す（判断は）。並びは過渡ではなくこの形で確定している。`,...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正",
  args: {
    tone: EditorTopBarTones.Error,
    fileErrors: SampleFileErrors,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...k.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れている状態。帯ごと赤へ振れ、保存状態の代わりにエラーの件数が出る。
パンくずも同じ色味へ寄ることと、古さの行が同じ帯に並ぶことをここで確かめる（実画面で凍結
中に見えるのはこの組み合わせ）。`,...k.parameters?.docs?.description}}},A=[`Saved`,`Saving`,`Failed`,`LastValidRender`,`FileInvalid`]}))();export{D as Failed,k as FileInvalid,O as LastValidRender,T as Saved,E as Saving,A as __namedExportsOrder,w as default};