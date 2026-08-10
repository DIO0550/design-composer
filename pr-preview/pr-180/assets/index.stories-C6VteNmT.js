import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-B-4r0qA3.js";import{n as i,r as a}from"./canvas-view-CRTN-ucG.js";import{t as o}from"./jsx-runtime-Cw9gq7QB.js";import{i as s,n as c,r as l,t as u}from"./document-save-state-C2EtDZ5m.js";function d({state:e}){return(0,f.jsxs)(l,{children:[(0,f.jsx)(l.Breadcrumb,{opened:p}),(0,f.jsx)(l.SaveBadge,{state:e}),(0,f.jsx)(l.Zoom,{view:i.create(),onZoomIn:()=>{},onZoomOut:()=>{},onReset:()=>{}})]})}var f,p,m,h,g,_,v;e((()=>{t(),a(),c(),s(),f=o(),p={path:`/work/settings-ui/app.dcmp`,document:r.createFromTemplate(n.DEFAULT)},m={title:`features/editor/EditorTopBar`,component:d,parameters:{layout:`fullscreen`}},h={name:`保存済み`,args:{state:u.SAVED}},g={name:`保存中`,args:{state:u.SAVING}},_={name:`保存に失敗`,args:{state:u.fromError({kind:`permissionDenied`,message:`/work/settings-ui/app.dcmp: 書き込みが許可されていない`})}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "保存済み",
  args: {
    state: DocumentSaveState.SAVED
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    state: DocumentSaveState.SAVING
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "保存に失敗",
  args: {
    state: DocumentSaveState.fromError({
      kind: "permissionDenied",
      message: "/work/settings-ui/app.dcmp: 書き込みが許可されていない"
    })
  }
}`,..._.parameters?.docs?.source}}},v=[`Saved`,`Saving`,`Failed`]}))();export{_ as Failed,h as Saved,g as Saving,v as __namedExportsOrder,m as default};