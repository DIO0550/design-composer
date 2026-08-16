import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./design-document-CmzPaaBf.js";import{a as r,n as i,o as a,r as o,s}from"./sample-editor-state-60TsMZsV.js";import{t as c}from"./jsx-runtime-Cw9gq7QB.js";import{n as l,t as u}from"./property-panel-BZZeEIZN.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{t(),r(),s(),l(),d=c(),{fn:f}=__STORYBOOK_MODULE_TEST__,p=`very-long-node-name-that-does-not-fit-in-the-heading`,m=a.create(n.create({artboards:[{name:`home`,width:360,height:240,children:[{name:`unset-box`,type:`Box`,props:{background:`missing`}}]}]})),h=a.create(n.create({artboards:[{name:`home`,width:360,height:240,children:[{name:p,type:`Box`}]}]})),g={title:`features/editor/PropertyPanel`,component:u,parameters:{layout:`padded`},decorators:[e=>(0,d.jsx)(`div`,{className:`flex h-[32rem] w-72 flex-col border border-gray-300 bg-white`,children:(0,d.jsx)(e,{})})],args:{onClearSelection:f(),onEditProp:f(),instance:{goToSource:f(),selectAllInstances:f(),detach:f()}}},_={name:`選択されていない`,args:{state:o}},v={name:`artboard を選択中`,args:{state:a.select(o,`home`)}},y={name:`Text ノードを選択中`,args:{state:a.select(o,`home-title`)}},b={name:`インスタンスを選択中（publicProps から生成）`,args:{state:a.select(o,`home-login`)}},x={name:`Box ノードを選択中`,args:{state:a.select(o,`overflow-wide`)}},S={name:`未指定の prop だけの Box を選択中`,args:{state:a.select(m,`unset-box`)}},C={name:`名前が長いノードを選択中`,args:{state:a.select(h,p)}},w={name:`凍結中`,args:{state:i}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "選択されていない",
  args: {
    state: SampleEditorState
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "artboard を選択中",
  args: {
    state: EditorState.select(SampleEditorState, "home")
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "Text ノードを選択中",
  args: {
    state: EditorState.select(SampleEditorState, "home-title")
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    state: EditorState.select(SampleEditorState, "home-login")
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Box ノードを選択中",
  args: {
    state: EditorState.select(SampleEditorState, "overflow-wide")
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "未指定の prop だけの Box を選択中",
  args: {
    state: EditorState.select(UnsetEditorState, "unset-box")
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LongNameEditorState, LongNodeName)
  }
}`,...C.parameters?.docs?.source},description:{story:`名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "凍結中",
  args: {
    state: FileInvalidEditorState
  }
}`,...w.parameters?.docs?.source},description:{story:`外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。`,...w.parameters?.docs?.description}}},T=[`Default`,`Selected`,`TextSelected`,`InstanceSelected`,`BoxSelected`,`Unset`,`LongName`,`Frozen`]}))();export{x as BoxSelected,_ as Default,w as Frozen,b as InstanceSelected,C as LongName,v as Selected,y as TextSelected,S as Unset,T as __namedExportsOrder,g as default};