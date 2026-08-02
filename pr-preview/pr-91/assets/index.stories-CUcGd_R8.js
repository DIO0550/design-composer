import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./editor-state-D_lFpsXN.js";import{n as r,r as i,t as a}from"./sample-editor-state-GLP4v-cG.js";import{n as o,t as s}from"./artboard-canvas-Bg1ax_C0.js";var c,l,u,d,f,p;e((()=>{i(),t(),o(),{fn:c}=__STORYBOOK_MODULE_TEST__,l={title:`features/editor/ArtboardCanvas`,component:s,parameters:{layout:`padded`},args:{onSelect:c()}},u={name:`選択なし`,args:{state:r}},d={name:`artboard を選択中`,args:{state:n.select(r,`settings`)}},f={name:`artboard がない`,args:{state:a}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`Selected`,`Empty`]}))();export{u as Default,f as Empty,d as Selected,p as __namedExportsOrder,l as default};