import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";import{n,t as r}from"./artboard-list-AJjbhWG5.js";import{i,r as a,t as o}from"./sample-sidebar-document-CMEGUBYS.js";var s,c,l,u,d,f,p,m;e((()=>{a(),n(),s=t(),{fn:c}=__STORYBOOK_MODULE_TEST__,l={title:`features/sidebar/ArtboardList`,component:r,parameters:{layout:`padded`},decorators:[e=>(0,s.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,s.jsx)(e,{})})],args:{onSelect:c()}},u={name:`選択なし（先頭が今の 1 枚）`,args:{selection:i()}},d={name:`別の artboard を選択中`,args:{selection:i(`settings`)}},f={name:`artboard 配下のノードを選択中`,args:{selection:i(`settings-card`)}},p={name:`artboard がない`,args:{selection:o}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("settings-card")
  }
}`,...f.parameters?.docs?.source},description:{story:`配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    selection: EmptySidebarSelection
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Selected`,`NodeSelected`,`Empty`]}))();export{u as Default,p as Empty,f as NodeSelected,d as Selected,m as __namedExportsOrder,l as default};