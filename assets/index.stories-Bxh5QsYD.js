import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i,t as a}from"./sample-editor-state-DbOuj1H6.js";import{n as o,t as s}from"./artboard-canvas-C4odtsJZ.js";import{t as c}from"./jsx-runtime-4HHWW5MW.js";var l,u,d,f,p,m,h;e((()=>{i(),t(),o(),l=c(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`features/editor/ArtboardCanvas`,component:s,parameters:{layout:`fullscreen`},decorators:[e=>(0,l.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,l.jsx)(e,{})})],args:{onSelect:u(),onMoveNode:u(),onResize:u(),onEditProp:u()}},f={name:`選択なし`,args:{state:r}},p={name:`artboard を選択中`,args:{state:n.select(r,`settings`)}},m={name:`artboard がない`,args:{state:a}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...p.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Selected`,`Empty`]}))();export{f as Default,m as Empty,p as Selected,h as __namedExportsOrder,d as default};