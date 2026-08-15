import{n as e}from"./chunk-BneVvdWh.js";import{a as t,n,o as r,r as i,s as a}from"./sample-editor-state-D1pLJpXF.js";import{t as o}from"./jsx-runtime-Cw9gq7QB.js";import{i as s,t as c}from"./left-pane-rail-Ci2n4EP0.js";import{n as l,t as u}from"./left-pane-COutlVR2.js";var d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{t(),s(),a(),l(),d=o(),{fn:f}=__STORYBOOK_MODULE_TEST__,p={select:f(),selectAt:f(),clearSelection:f(),reveal:f(),reorder:f(),move:f(),resize:f(),editProp:f(),insert:f(),insertInstance:f(),detachInstance:f(),createComponent:f(),isInsertEnabled:!0},m={select:f(),add:f(),setValue:f(),rename:f(),remove:f()},h={title:`features/editor/LeftPane`,component:u,parameters:{layout:`fullscreen`},args:{onSelectView:f(),state:i,node:p,token:m},decorators:[e=>(0,d.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,d.jsx)(e,{})})]},g={name:`Layers（ツリー）`,args:{view:c.layers}},_={name:`Assets（部品のパレット）`,args:{view:c.assets}},v={name:`Tokens（トークン一覧）`,args:{view:c.tokens}},y={name:`Assets（挿せる位置が無い）`,args:{view:c.assets,node:{...p,isInsertEnabled:!1}}},b={name:`Layers（ノードを選択中）`,args:{view:c.layers,state:r.select(i,`home`)}},x={name:`Layers（凍結中）`,args:{view:c.layers,state:n}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LEFT_PANE_VIEWS.layers
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LEFT_PANE_VIEWS.assets
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LEFT_PANE_VIEWS.tokens
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "Assets（挿せる位置が無い）",
  args: {
    view: LEFT_PANE_VIEWS.assets,
    node: {
      ...NODE_ACTIONS,
      isInsertEnabled: false
    }
  }
}`,...y.parameters?.docs?.source},description:{story:"挿せる位置が無いときの `Assets`。部品の行の挿入ボタンが押せなくなる。",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LEFT_PANE_VIEWS.layers,
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home")
  }
}`,...b.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LEFT_PANE_VIEWS.layers,
    state: FILE_INVALID_EDITOR_STATE
  }
}`,...x.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に\nなる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...x.parameters?.docs?.description}}},S=[`Layers`,`Assets`,`Tokens`,`AssetsInsertDisabled`,`LayersSelected`,`LayersFrozen`]}))();export{_ as Assets,y as AssetsInsertDisabled,g as Layers,x as LayersFrozen,b as LayersSelected,v as Tokens,S as __namedExportsOrder,h as default};