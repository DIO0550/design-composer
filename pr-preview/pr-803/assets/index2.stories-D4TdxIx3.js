import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,t as i}from"./document-tab-bar-g1lCsWN_.js";import{n as a,t as o}from"./opened-documents-oY-AvMoN.js";var s,c,l,u,d,f,p;e((()=>{n(),a(),r(),s=`/work/login.dcmp`,c=`/work/settings.dcmp`,l=o.activate(o.open(o.open(o.create(t(s)),t(c)),t(`/work/design-system/tokens.dcmp`)),c),u={title:`features/editor/features/document-start/DocumentTabBar`,component:i,parameters:{layout:`fullscreen`},args:{opened:o.create(t(s)),onSelect:()=>{},onClose:()=>{}}},d={name:`1 つだけ開いている`},f={name:`複数開いている`,args:{opened:l}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "1 つだけ開いている"
}`,...d.parameters?.docs?.source},description:{story:`1 つだけ開いている状態。閉じるボタンはこのときも出る。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    opened: ThreeOpened
  }
}`,...f.parameters?.docs?.source},description:{story:`複数開いている状態。見ているものだけ地が敷かれる。`,...f.parameters?.docs?.description}}},p=[`Single`,`Multiple`]}))();export{f as Multiple,d as Single,p as __namedExportsOrder,u as default};