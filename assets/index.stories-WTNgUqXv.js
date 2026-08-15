import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./design-document-B0fuhw05.js";import{a as i,o as a,r as o,s}from"./sample-editor-state-CQv0rK1_.js";import{t as c}from"./jsx-runtime-Cw9gq7QB.js";import{n as l,t as u}from"./document-tree-Dg6Yf3zA.js";var d,f,p,m,h,g,_,v,y;e((()=>{t(),i(),s(),l(),d=c(),{fn:f}=__STORYBOOK_MODULE_TEST__,p={title:`features/editor/DocumentTree`,component:u,parameters:{layout:`padded`},decorators:[e=>(0,d.jsx)(`div`,{className:`w-64 border border-gray-300 bg-white p-3`,children:(0,d.jsx)(e,{})})],args:{onSelect:f(),onReorder:f()}},m={name:`選択なし`,args:{state:o}},h={name:`別の artboard を選択中`,args:{state:a.select(o,`settings`)}},g={name:`artboard 配下のノードを選択中`,args:{state:a.select(o,`home-title`)}},_=a.create(r.create({tokens:n.DEFAULT.tokens,components:n.DEFAULT.components,artboards:[{name:`nested`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingX:`lg`},children:[{name:`header`,type:`Text`,props:{content:`見出し`,typography:`heading`}},{name:`body`,type:`Box`,props:{direction:`column`,gap:`sm`},children:[{name:`body-text`,type:`Text`,props:{content:`本文`}},{name:`body-action`,ref:`primary-button`,overrides:{label:`送信`}}]},{name:`footer`,type:`Text`,props:{content:`脚注`}}]}]})),v={name:`入れ子のノードと並べ替え`,args:{state:_}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "settings")
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title")
  }
}`,...g.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "入れ子のノードと並べ替え",
  args: {
    state: NESTED_EDITOR_STATE
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`OtherArtboard`,`NodeSelected`,`Nested`]}))();export{m as Default,v as Nested,g as NodeSelected,h as OtherArtboard,y as __namedExportsOrder,p as default};