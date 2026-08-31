import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./left-pane-shell-Cbogr8w8.js";import{n as i,t as a}from"./Option-CTa-i89e.js";import{n as o,r as s,t as c}from"./design-document-DyhxCh3S.js";import{n as l,t as u}from"./create-component-Cqmk3Fne.js";var d,f=e((()=>{o(),d=c.create({tokens:s.Default.tokens,components:s.Default.components,artboards:[{name:`home`,width:360,height:240,children:[{name:`home-panel`,type:`Box`,children:[{name:`home-title`,type:`Text`}]},{name:`home-login`,ref:`primary-button`}]}]})}));async function p(){await y.click(v.getByRole(`button`,{name:/Create component/})),await y.type(v.getByRole(`textbox`,{name:`部品名`}),b)}function m(){return v.getByRole(`button`,{name:/Create component/}).hasAttribute(`disabled`)}var h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{n(),f(),i(),l(),h=t(),{expect:g,fn:_,screen:v,userEvent:y}=__STORYBOOK_MODULE_TEST__,b=`info-panel`,x={title:`features/assets/CreateComponent`,component:u,parameters:{layout:`padded`},args:{document:d,singleName:a.some(`home-title`),isFrozen:!1,onCreate:_()},decorators:[e=>(0,h.jsx)(r,{children:(0,h.jsx)(e,{})})]},S={name:`ノードを選んでいる`},C={name:`インスタンスを選んでいる`,args:{singleName:a.some(`home-login`)}},w={name:`artboard を選んでいる`,args:{singleName:a.some(`home`)}},T={name:`何も選んでいない`,args:{singleName:a.none}},E={name:`部品名を打っている`,play:async()=>{await p(),await g(m()).toBe(!1)}},D={name:`ファイルが不正な間に部品名を打っている`,args:{isFrozen:!0},play:async()=>{await p(),await g(m()).toBe(!0)}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "ノードを選んでいる"
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選んでいる",
  args: {
    singleName: Option.some("home-login")
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "artboard を選んでいる",
  args: {
    singleName: Option.some("home")
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "何も選んでいない",
  args: {
    singleName: Option.none
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "部品名を打っている",
  play: async () => {
    await enterDraftName();
    await expect(isCreateDisabled()).toBe(false);
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "ファイルが不正な間に部品名を打っている",
  args: {
    isFrozen: true
  },
  play: async () => {
    await enterDraftName();
    await expect(isCreateDisabled()).toBe(true);
  }
}`,...D.parameters?.docs?.source}}},O=[`Ready`,`InstanceSelected`,`ArtboardSelected`,`Unselected`,`Naming`,`Frozen`]}))();export{w as ArtboardSelected,D as Frozen,C as InstanceSelected,E as Naming,S as Ready,T as Unselected,O as __namedExportsOrder,x as default};