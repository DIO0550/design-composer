import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./file-paths-D1kwSinv.js";import{a as r,i,n as a,t as o}from"./document-tab-bar-CR6a6ZU5.js";import{n as s,t as c}from"./opened-documents-DUoo56wT.js";var l,u,d,f,p,m,h,g;e((()=>{t(),i(),s(),a(),l=n(`/work/login.dcmp`),u=n(`/work/settings.dcmp`),d=n(`/work/design-system/tokens.dcmp`),f=c.activate(c.open(c.open(c.create(r(l)),r(u)),r(d)),u),p={title:`features/editor/features/document-start/DocumentTabBar`,component:o,parameters:{layout:`fullscreen`},args:{opened:c.create(r(l)),onSelect:()=>{},onClose:()=>{},onReorder:()=>{}}},m={name:`1 つだけ開いている`},h={name:`複数開いている`,args:{opened:f}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "1 つだけ開いている"
}`,...m.parameters?.docs?.source},description:{story:`1 つだけ開いている状態。閉じるボタンはこのときも出る。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    opened: ThreeOpened
  }
}`,...h.parameters?.docs?.source},description:{story:`複数開いている状態。見ているものだけ地が敷かれる。`,...h.parameters?.docs?.description}}},g=[`Single`,`Multiple`]}))();export{h as Multiple,m as Single,g as __namedExportsOrder,p as default};