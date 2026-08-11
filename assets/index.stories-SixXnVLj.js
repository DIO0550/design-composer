import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i,t as a}from"./sample-editor-state-DLvXGXA8.js";import{a as o,n as s,o as c,t as l}from"./artboard-canvas-F4TuiFFi.js";import{t as u}from"./jsx-runtime-Cw9gq7QB.js";function d(e){let t=c();return(0,f.jsx)(l,{...e,canvasView:t})}var f,p,m,h,g,_,v;e((()=>{i(),t(),o(),s(),f=u(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/editor/ArtboardCanvas`,component:d,parameters:{layout:`fullscreen`},decorators:[e=>(0,f.jsx)(`div`,{className:`h-screen bg-gray-100`,children:(0,f.jsx)(e,{})})],args:{onSelect:p(),onMoveNode:p(),onResize:p(),onEditProp:p()}},h={name:`選択なし`,args:{state:r}},g={name:`artboard を選択中`,args:{state:n.select(r,`settings`)}},_={name:`artboard がない`,args:{state:a}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...g.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。`,...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,..._.parameters?.docs?.source}}},v=[`Default`,`Selected`,`Empty`]}))();export{h as Default,_ as Empty,g as Selected,v as __namedExportsOrder,m as default};