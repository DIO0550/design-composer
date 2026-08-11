import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-B-4r0qA3.js";import{n as i,r as a}from"./canvas-view-CRTN-ucG.js";import{t as o}from"./jsx-runtime-Cw9gq7QB.js";import{a as s,i as c,n as l,o as u,r as d,s as f}from"./elapsed-D8kHTRvs.js";function p({state:e,elapsed:t}){return(0,m.jsxs)(u,{children:[(0,m.jsx)(u.Breadcrumb,{opened:h}),(0,m.jsx)(u.SaveBadge,{state:e}),(0,m.jsx)(u.Zoom,{view:i.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}}),t?(0,m.jsx)(u.LastValidRender,{elapsed:t}):null]})}var m,h,g,_,v,y,b,x;e((()=>{t(),a(),s(),d(),f(),m=o(),h={path:`/work/settings-ui/app.dcmp`,document:r.createFromTemplate(n.DEFAULT)},g={title:`features/editor/EditorTopBar`,component:p,parameters:{layout:`fullscreen`}},_={name:`保存済み`,args:{state:c.SAVED}},v={name:`保存中`,args:{state:c.SAVING}},y={name:`保存に失敗`,args:{state:c.fromError({kind:`permissionDenied`,message:`/work/settings-ui/app.dcmp: 書き込みが許可されていない`})}},b={name:`最後に正常だった表示を出している状態`,args:{state:c.SAVED,elapsed:{unit:l.Seconds,count:4}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "保存済み",
  args: {
    state: DocumentSaveState.SAVED
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    state: DocumentSaveState.SAVING
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "保存に失敗",
  args: {
    state: DocumentSaveState.fromError({
      kind: "permissionDenied",
      message: "/work/settings-ui/app.dcmp: 書き込みが許可されていない"
    })
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "最後に正常だった表示を出している状態",
  args: {
    state: DocumentSaveState.SAVED,
    elapsed: {
      unit: ElapsedUnits.Seconds,
      count: 4
    }
  }
}`,...b.parameters?.docs?.source},description:{story:`外部編集でファイルが不正になり、映っているのが最後に正常だった表示になっている状態（#183）。

このストーリーだけが、古さの行と倍率が**同じ帯へ並ぶ**ところを映す。UI 案の Error 画面には
倍率が無く、凍結表示（#135）が入るまでの過渡的な並びなので、視覚差分で見えるようにしておく。`,...b.parameters?.docs?.description}}},x=[`Saved`,`Saving`,`Failed`,`LastValidRender`]}))();export{y as Failed,b as LastValidRender,_ as Saved,v as Saving,x as __namedExportsOrder,g as default};