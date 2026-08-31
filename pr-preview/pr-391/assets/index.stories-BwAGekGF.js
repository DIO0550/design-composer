import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./left-pane-shell-Cbogr8w8.js";import{n as i,r as a,t as o}from"./design-document-B60NCZ59.js";import{n as s,t as c}from"./document-selection-D1EPqGSM.js";import{n as l,t as u}from"./document-tree-BDhiz5QX.js";import{i as d,r as f}from"./sample-sidebar-document-CVhbLvUH.js";var p,m,h,g,_,v,y,b,x;e((()=>{n(),i(),s(),f(),l(),p=t(),{fn:m}=__STORYBOOK_MODULE_TEST__,h={title:`features/sidebar/DocumentTree`,component:u,parameters:{layout:`padded`},decorators:[e=>(0,p.jsx)(r,{children:(0,p.jsx)(`div`,{className:`p-3`,children:(0,p.jsx)(e,{})})})],args:{onSelect:m(),onReorder:m()}},g={name:`選択なし`,args:{selection:d()}},_={name:`別の artboard を選択中`,args:{selection:d(`settings`)}},v={name:`artboard 配下のノードを選択中`,args:{selection:d(`home-title`)}},y=c.fromNames(o.create({tokens:a.Default.tokens,components:a.Default.components,artboards:[{name:`nested`,width:360,height:240,props:{direction:`column`,gap:`md`,paddingRight:`lg`,paddingLeft:`lg`},children:[{name:`header`,type:`Text`,props:{content:`見出し`,typography:`heading`}},{name:`body`,type:`Box`,props:{direction:`column`,gap:`sm`},children:[{name:`body-text`,type:`Text`,props:{content:`本文`}},{name:`body-action`,ref:`primary-button`,overrides:{label:`送信`}}]},{name:`footer`,type:`Text`,props:{content:`脚注`}}]}]}),[]),b={name:`入れ子のノードと並べ替え`,args:{selection:y}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "選択なし",
  args: {
    selection: sampleSidebarSelection()
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "別の artboard を選択中",
  args: {
    selection: sampleSidebarSelection("settings")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard 配下のノードを選択中",
  args: {
    selection: sampleSidebarSelection("home-title")
  }
}`,...v.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "入れ子のノードと並べ替え",
  args: {
    selection: NestedSelection
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`OtherArtboard`,`NodeSelected`,`Nested`]}))();export{g as Default,b as Nested,v as NodeSelected,_ as OtherArtboard,x as __namedExportsOrder,h as default};