import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-Krbv6DGJ.js";import{a as i,i as a,n as o,r as s,t as c}from"./sample-editor-state-aY8mLVaA.js";import{t as l}from"./jsx-runtime-4HHWW5MW.js";import{n as u,t as d}from"./document-tree-B-Z_ITWS.js";var f,p,m,h,g,_,v,y,b,x;e((()=>{t(),s(),i(),u(),f=l(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`features/editor/DocumentTree`,component:d,parameters:{layout:`padded`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,f.jsx)(e,{})})],args:{onSelect:p(),onReorder:p()}},h={name:`選択なし`,args:{state:o}},g={name:`artboard を選択中`,args:{state:a.select(o,`home`)}},_={name:`artboard 配下のノードを選択中`,args:{state:a.select(o,`home-title`)}},v={name:`artboard がない`,args:{state:c}},y=a.create(r.create({tokens:n.DEFAULT.tokens,components:n.DEFAULT.components,artboards:[{name:`nested`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingX:`lg`},children:[{name:`header`,type:`Text`,props:{content:`見出し`,typography:`heading`}},{name:`body`,type:`Box`,props:{direction:`column`,gap:`sm`},children:[{name:`body-text`,type:`Text`,props:{content:`本文`}},{name:`body-action`,ref:`primary-button`,overrides:{label:`送信`}}]},{name:`footer`,type:`Text`,props:{content:`脚注`}}]}]})),b={name:`入れ子のノードと並べ替え`,args:{state:y}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard がない",
  args: {
    state: EMPTY_EDITOR_STATE
  }
}`,...v.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "入れ子のノードと並べ替え",
  args: {
    state: NESTED_EDITOR_STATE
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`Selected`,`NodeSelected`,`Empty`,`Nested`]}))();export{h as Default,v as Empty,b as Nested,_ as NodeSelected,g as Selected,x as __namedExportsOrder,m as default};