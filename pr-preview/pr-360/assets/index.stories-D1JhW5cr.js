import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,t as r}from"./screen-height-shell-D7M0puoE.js";import{n as i,t as a}from"./editor-layout-C3DZlBsp.js";var o,s,c,l,u;e((()=>{n(),i(),o=t(),s={title:`features/editor/EditorLayout`,component:a,parameters:{layout:`fullscreen`},decorators:[e=>(0,o.jsx)(r,{children:(0,o.jsx)(e,{})})],args:{dragHandlers:{onPointerMove:()=>{},onPointerUp:()=>{},onPointerLeave:()=>{}}}},c={name:`3ペインに中身を差し込む`,args:{children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a.LeftPane,{isFrozen:!1,children:`レール・パネル`}),(0,o.jsx)(a.CenterPane,{children:`キャンバス`}),(0,o.jsx)(a.RightPane,{isFrozen:!1,children:`プロパティパネル`})]})}},l={name:`凍結した3ペイン`,args:{children:(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a.LeftPane,{isFrozen:!0,children:`レール・パネル`}),(0,o.jsx)(a.CenterPane,{children:`キャンバス`}),(0,o.jsx)(a.RightPane,{isFrozen:!0,children:`プロパティパネル`})]})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "3ペインに中身を差し込む",
  args: {
    children: <>
        <EditorLayout.LeftPane isFrozen={false}>
          レール・パネル
        </EditorLayout.LeftPane>
        <EditorLayout.CenterPane>キャンバス</EditorLayout.CenterPane>
        <EditorLayout.RightPane isFrozen={false}>
          プロパティパネル
        </EditorLayout.RightPane>
      </>
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "凍結した3ペイン",
  args: {
    children: <>
        <EditorLayout.LeftPane isFrozen>レール・パネル</EditorLayout.LeftPane>
        <EditorLayout.CenterPane>キャンバス</EditorLayout.CenterPane>
        <EditorLayout.RightPane isFrozen>
          プロパティパネル
        </EditorLayout.RightPane>
      </>
  }
}`,...l.parameters?.docs?.source},description:{story:`ファイルが不正で表示を凍結した 3 ペイン（#135）。凍結が掛かるのは左右のペインだけで、
キャンバスは自前でスクリムを持つ。

淡色そのものはここでは比べられない。ペインの中身が白地の文字だけなので、
\`FrozenPaneClass\` を落としても視覚差分が閾値に届かない（実測 0.0004 / 閾値 0.002。#346）。`,...l.parameters?.docs?.description}}},u=[`Default`,`Frozen`]}))();export{c as Default,l as Frozen,u as __namedExportsOrder,s as default};