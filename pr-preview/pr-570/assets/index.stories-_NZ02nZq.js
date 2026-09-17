import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./opened-documents-C1tVvglx.js";import{a as r,i,n as a,t as o}from"./document-tab-bar-BiKP0-UU.js";var s,c,l,u,d,f,p;e((()=>{i(),t(),a(),s=`/work/login.dcmp`,c=`/work/settings.dcmp`,l=n.activate(n.open(n.open(n.create(r(s)),r(c)),r(`/work/design-system/tokens.dcmp`)),c),u={title:`features/documentStart/DocumentTabBar`,component:o,parameters:{layout:`fullscreen`},args:{opened:n.create(r(s)),onSelect:()=>{},onClose:()=>{}}},d={name:`1 つだけ開いている`},f={name:`複数開いている`,args:{opened:l}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "1 つだけ開いている"
}`,...d.parameters?.docs?.source},description:{story:`1 つだけ開いている状態。閉じるボタンはこのときも出る。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    opened: ThreeOpened
  }
}`,...f.parameters?.docs?.source},description:{story:`複数開いている状態。見ているものだけ地が敷かれる。`,...f.parameters?.docs?.description}}},p=[`Single`,`Multiple`]}))();export{f as Multiple,d as Single,p as __namedExportsOrder,u as default};