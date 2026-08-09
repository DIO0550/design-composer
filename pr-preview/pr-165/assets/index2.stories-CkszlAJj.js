import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-k_lIP3Iw.js";import{a as r,i,n as a,r as o}from"./sample-editor-state-DzCNsEIA.js";import{t as s}from"./jsx-runtime-4HHWW5MW.js";import{n as c,t as l}from"./property-panel-BYqrZ-8U.js";var u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{t(),o(),r(),c(),u=s(),{fn:d}=__STORYBOOK_MODULE_TEST__,f=`very-long-node-name-that-does-not-fit-in-the-heading`,p=i.create(n.create({artboards:[{name:`home`,width:360,height:240,children:[{name:f,type:`Box`}]}]})),m={title:`features/editor/PropertyPanel`,component:l,parameters:{layout:`padded`},decorators:[e=>(0,u.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,u.jsx)(e,{})})],args:{onClearSelection:d(),onEditProp:d(),instance:{goToSource:d(),detach:d()}}},h={name:`選択されていない`,args:{state:a}},g={name:`artboard を選択中`,args:{state:i.select(a,`home`)}},_={name:`Text ノードを選択中`,args:{state:i.select(a,`home-title`)}},v={name:`インスタンスを選択中（publicProps から生成）`,args:{state:i.select(a,`home-login`)}},y={name:`Box ノードを選択中`,args:{state:i.select(a,`overflow-wide`)}},b={name:`名前が長いノードを選択中`,args:{state:i.select(p,f)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SAMPLE_EDITOR_STATE
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login")
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "overflow-wide")
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LONG_NAME_EDITOR_STATE, LONG_NODE_NAME)
  }
}`,...b.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...b.parameters?.docs?.description}}},x=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`LongName`]}))();export{y as BoxSelected,h as Default,v as InstanceSelected,b as LongName,g as Selected,_ as TextSelected,x as __namedExportsOrder,m as default};