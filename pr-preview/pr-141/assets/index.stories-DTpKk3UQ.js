import{n as e}from"./chunk-BneVvdWh.js";import{a as t,i as n,n as r,r as i}from"./sample-editor-state-Q7iPvVtC.js";import{t as a}from"./jsx-runtime-4HHWW5MW.js";import{i as o,t as s}from"./left-pane-rail-yO7SoO0R.js";import{n as c,t as l}from"./left-pane-DWSBydTE.js";var u,d,f,p,m,h,g,_,v,y,b;e((()=>{i(),o(),t(),c(),u=a(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={select:d(),selectAt:d(),clearSelection:d(),reorder:d(),move:d(),resize:d(),editProp:d(),insert:d(),insertInstance:d(),remove:d(),isInsertEnabled:!0,isRemoveEnabled:!0},p={select:d(),add:d(),setValue:d(),rename:d(),remove:d()},m={title:`features/editor/LeftPane`,component:l,parameters:{layout:`fullscreen`},args:{onSelectView:d(),state:r,node:f,token:p},decorators:[e=>(0,u.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,u.jsx)(e,{})})]},h={name:`Layers（ツリー）`,args:{view:s.layers}},g={name:`Assets（部品のパレット）`,args:{view:s.assets}},_={name:`Tokens（トークン一覧）`,args:{view:s.tokens}},v={name:`Assets（挿せる位置が無い）`,args:{view:s.assets,node:{...f,isInsertEnabled:!1}}},y={name:`Layers（ノードを選択中）`,args:{view:s.layers,state:n.select(r,`home`)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LEFT_PANE_VIEWS.layers
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LEFT_PANE_VIEWS.assets
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LEFT_PANE_VIEWS.tokens
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "Assets（挿せる位置が無い）",
  args: {
    view: LEFT_PANE_VIEWS.assets,
    node: {
      ...NODE_ACTIONS,
      isInsertEnabled: false
    }
  }
}`,...v.parameters?.docs?.source},description:{story:"挿せる位置が無いときの `Assets`。部品の行の挿入ボタンが押せなくなる。",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LEFT_PANE_VIEWS.layers,
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...y.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...y.parameters?.docs?.description}}},b=[`Layers`,`Assets`,`Tokens`,`AssetsInsertDisabled`,`LayersSelected`]}))();export{g as Assets,v as AssetsInsertDisabled,h as Layers,y as LayersSelected,_ as Tokens,b as __namedExportsOrder,m as default};