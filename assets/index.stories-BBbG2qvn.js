import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i,t as a}from"./sample-editor-state-Bq3EDzMt.js";import{t as o}from"./jsx-runtime-Cw9gq7QB.js";import{n as s,t as c}from"./artboard-list-BbgzaLgl.js";var l,u,d,f,p,m,h,g;e((()=>{i(),t(),s(),l=o(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`features/editor/ArtboardList`,component:c,parameters:{layout:`padded`},decorators:[e=>(0,l.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,l.jsx)(e,{})})],args:{onSelect:u()}},f={name:`選択なし（先頭が今の 1 枚）`,args:{state:r}},p={name:`別の artboard を選択中`,args:{state:n.select(r,`settings`)}},m={name:`artboard 配下のノードを選択中`,args:{state:n.select(r,`settings-card`)}},h={name:`artboard がない`,args:{state:a}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings-card")
  }
}`,...m.parameters?.docs?.source},description:{story:`配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Selected`,`NodeSelected`,`Empty`]}))();export{f as Default,h as Empty,m as NodeSelected,p as Selected,g as __namedExportsOrder,d as default};