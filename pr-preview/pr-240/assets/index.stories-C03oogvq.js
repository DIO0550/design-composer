import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-Cw9gq7QB.js";import{n,t as r}from"./editor-layout-DyJaaEwv.js";var i,a,o,s,c;e((()=>{n(),i=t(),a={title:`features/editor/EditorLayout`,component:r,parameters:{layout:`fullscreen`},args:{dragHandlers:{onPointerMove:()=>{},onPointerUp:()=>{},onPointerLeave:()=>{}}}},o={name:`3ペインに中身を差し込む`,args:{children:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.LeftPane,{isFrozen:!1,children:`レール・パネル`}),(0,i.jsx)(r.CenterPane,{children:`キャンバス`}),(0,i.jsx)(r.RightPane,{isFrozen:!1,children:`プロパティパネル`})]})}},s={name:`凍結した3ペイン`,args:{children:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.LeftPane,{isFrozen:!0,children:`レール・パネル`}),(0,i.jsx)(r.CenterPane,{children:`キャンバス`}),(0,i.jsx)(r.RightPane,{isFrozen:!0,children:`プロパティパネル`})]})}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source},description:{story:`ファイルが不正で表示を凍結した 3 ペイン（#135）。左右が淡色に落ちることを
ここで比べられる（凍結は左右のペインだけで、キャンバスは自前でスクリムを持つ）。`,...s.parameters?.docs?.description}}},c=[`Default`,`Frozen`]}))();export{o as Default,s as Frozen,c as __namedExportsOrder,a as default};