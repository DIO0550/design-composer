import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-B-4r0qA3.js";import{a as r,i,n as a,r as o}from"./sample-editor-state-DLvXGXA8.js";import{t as s}from"./jsx-runtime-Cw9gq7QB.js";import{n as c,t as l}from"./property-panel-BWGVESxK.js";var u,d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{t(),o(),r(),c(),u=s(),{fn:d}=__STORYBOOK_MODULE_TEST__,f=`very-long-node-name-that-does-not-fit-in-the-heading`,p=i.create(n.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]})),m=i.create(n.create({artboards:[{name:`home`,width:360,height:240,children:[{name:f,type:`Box`}]}]})),h={title:`features/editor/PropertyPanel`,component:l,parameters:{layout:`padded`},decorators:[e=>(0,u.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,u.jsx)(e,{})})],args:{onClearSelection:d(),onEditProp:d(),instance:{goToSource:d(),detach:d()}}},g={name:`選択されていない`,args:{state:a}},_={name:`artboard を選択中`,args:{state:i.select(a,`home`)}},v={name:`Text ノードを選択中`,args:{state:i.select(a,`home-title`)}},y={name:`インスタンスを選択中（publicProps から生成）`,args:{state:i.select(a,`home-login`)}},b={name:`Box ノードを選択中`,args:{state:i.select(a,`overflow-wide`)}},x={name:`未指定の prop だけの Box を選択中`,args:{state:i.select(p,`unset-box`)}},S={name:`名前が長いノードを選択中`,args:{state:i.select(m,f)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title")
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login")
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "overflow-wide")
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    state: EditorState.select(UNSET_EDITOR_STATE, "unset-box")
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LONG_NAME_EDITOR_STATE, LONG_NODE_NAME)
  }
}`,...S.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...S.parameters?.docs?.description}}},C=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`]}))();export{b as BoxSelected,g as Default,y as InstanceSelected,S as LongName,_ as Selected,v as TextSelected,x as Unset,C as __namedExportsOrder,h as default};