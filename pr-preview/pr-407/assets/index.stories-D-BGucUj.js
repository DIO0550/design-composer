import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./left-pane-shell-Cbogr8w8.js";import{n as i,t as a}from"./artboard-list-CA_XKwpC.js";import{i as o,r as s,t as c}from"./sample-sidebar-document-CRxccaeE.js";var l,u,d,f,p,m,h,g;e((()=>{n(),s(),i(),l=t(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`features/sidebar/ArtboardList`,component:a,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(r,{children:(0,l.jsx)(`div`,{className:`p-3`,children:(0,l.jsx)(e,{})})})],args:{onSelect:u(),artboardActions:{add:u(),reorder:u()}}},f={name:`選択なし（先頭が今の 1 枚）`,args:{selection:o()}},p={name:`別の artboard を選択中`,args:{selection:o(`settings`)}},m={name:`artboard 配下のノードを選択中`,args:{selection:o(`settings-card`)}},h={name:`artboard がない`,args:{selection:c}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("settings-card")
  }
}`,...m.parameters?.docs?.source},description:{story:`配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: EmptySidebarSelection
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Selected`,`NodeSelected`,`Empty`]}))();export{f as Default,h as Empty,m as NodeSelected,p as Selected,g as __namedExportsOrder,d as default};