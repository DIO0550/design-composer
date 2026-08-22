import{n as e}from"./chunk-BneVvdWh.js";import{n as t,r as n,t as r}from"./asset-grab-COplsV-t.js";import{t as i}from"./jsx-runtime-4HHWW5MW.js";import{a,n as o,r as s}from"./sample-editor-state-DjG_EzGl.js";import{n as c,t as l}from"./editor-state-Guu_TQnK.js";import{n as u,t as d}from"./left-pane-Bm01EcER.js";import{i as f,r as p}from"./left-pane-rail-RnKhRsqj.js";var m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{n(),a(),f(),c(),u(),m=i(),{fn:h}=__STORYBOOK_MODULE_TEST__,g={select:h(),selectAt:h(),clearSelection:h(),reveal:h(),reorder:h(),move:h(),resize:h(),editProp:h(),insert:h(),insertAt:h(),detachInstance:h(),selectAllInstances:h(),createComponent:h(),isInsertEnabled:!0},_={select:h(),add:h(),setValue:h(),rename:h(),remove:h()},v={title:`features/editor/LeftPane`,component:d,parameters:{layout:`fullscreen`},args:{onSelectView:h(),state:s,node:g,token:_,grab:r},decorators:[e=>(0,m.jsx)(`div`,{className:`flex h-[36rem] w-76 border-gray-300 border-r bg-white`,children:(0,m.jsx)(e,{})})]},y={name:`Layers（ツリー）`,args:{view:p.Layers}},b={name:`Assets（部品のパレット）`,args:{view:p.Assets}},x={name:`Tokens（トークン一覧）`,args:{view:p.Tokens}},S={name:`Assets（行を掴んで運んでいる）`,args:{view:p.Assets,grab:t(`primary-button`)}},C={name:`Layers（ノードを選択中）`,args:{view:p.Layers,state:l.select(s,`home`)}},w={name:`Layers（凍結中）`,args:{view:p.Layers,state:o}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "Layers（ツリー）",
  args: {
    view: LeftPaneViews.Layers
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "Assets（部品のパレット）",
  args: {
    view: LeftPaneViews.Assets
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Tokens（トークン一覧）",
  args: {
    view: LeftPaneViews.Tokens
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button")
  }
}`,...S.parameters?.docs?.source},description:{story:"パレットの行を掴んでキャンバスへ運んでいる `Assets`（#203）。\n掴んでいる行だけが青くなる。",...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    state: EditorState.select(SampleEditorState, "home")
  }
}`,...C.parameters?.docs?.source},description:{story:"ノードを選んだ状態の `Layers`。行の選択が見える。",...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    state: FileInvalidEditorState
  }
}`,...w.parameters?.docs?.source},description:{story:"外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に\nなる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。",...w.parameters?.docs?.description}}},T=[`Layers`,`Assets`,`Tokens`,`AssetsGrabbed`,`LayersSelected`,`LayersFrozen`]}))();export{b as Assets,S as AssetsGrabbed,y as Layers,w as LayersFrozen,C as LayersSelected,x as Tokens,T as __namedExportsOrder,v as default};