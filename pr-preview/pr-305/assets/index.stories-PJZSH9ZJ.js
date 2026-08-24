import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./Option-ByzVpLNU.js";import{n as i,r as a,t as o}from"./design-document-CflW7GBc.js";import{n as s,t as c}from"./create-component-CnaehA-J.js";var l,u=e((()=>{i(),l=o.create({tokens:a.Default.tokens,components:a.Default.components,artboards:[{name:`home`,width:360,height:240,children:[{name:`home-panel`,type:`Box`,children:[{name:`home-title`,type:`Text`}]},{name:`home-login`,ref:`primary-button`}]}]})})),d,f,p,m,h,g,_,v;e((()=>{u(),n(),s(),d=t(),{fn:f}=__STORYBOOK_MODULE_TEST__,p={title:`features/assets/CreateComponent`,component:c,parameters:{layout:`padded`},args:{document:l,singleName:r.some(`home-title`),isFrozen:!1,onCreate:f()},decorators:[e=>(0,d.jsx)(`div`,{className:`w-62 border border-gray-300 bg-white`,children:(0,d.jsx)(e,{})})]},m={name:`ノードを選んでいる`},h={name:`インスタンスを選んでいる`,args:{singleName:r.some(`home-login`)}},g={name:`artboard を選んでいる`,args:{singleName:r.some(`home`)}},_={name:`何も選んでいない`,args:{singleName:r.none}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "ノードを選んでいる"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選んでいる",
  args: {
    singleName: Option.some("home-login")
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいる",
  args: {
    singleName: Option.some("home")
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    singleName: Option.none
  }
}`,..._.parameters?.docs?.source}}},v=[`Ready`,`InstanceSelected`,`ArtboardSelected`,`Unselected`]}))();export{g as ArtboardSelected,h as InstanceSelected,m as Ready,_ as Unselected,v as __namedExportsOrder,p as default};