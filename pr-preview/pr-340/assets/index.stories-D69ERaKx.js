import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{a as n,r}from"./compiled-element-DRU_sK8F.js";import{i,r as a}from"./node-resize-CdQlgyS5.js";import{n as o,t as s}from"./resize-handle-style-l9srti-4.js";var c,l,u,d,f,p;e((()=>{n(),i(),o(),c=t(),l={title:`features/canvas/ArtboardCanvas/ResizeHandleStyle`,component:s,parameters:{layout:`fullscreen`,docs:{description:{component:`選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。

ハンドルは擬似要素なので \`<style>\` を差し込むだけで、この部品自身は何も描かない。
**当たった相手**を見るために、キャンバスの中身と同じ形（名前の属性を持つ div）を
器として敷いている。

\`ArtboardCanvas\` の「artboard を選択中」でも見えるが、そちらは倍率 1 のみ。
帯の太さを倍率で割り戻していることは、倍率違いを並べないと確かめられない。`}}},args:{name:`home`},decorators:[e=>(0,c.jsxs)(`div`,{className:`h-56 bg-gray-100 p-8`,children:[(0,c.jsx)(`div`,{[r]:`home`,className:`h-32 w-56 bg-white shadow-sm outline-2 outline-blue-500`}),(0,c.jsx)(e,{})]})]},u={name:`幅と高さの両方`,args:{handles:[a.create(`width`,224),a.create(`height`,128)],scale:1}},d={name:`幅だけ`,args:{handles:[a.create(`width`,224)],scale:1}},f={name:`倍率 2 倍`,args:{handles:[a.create(`width`,224),a.create(`height`,128)],scale:2}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "幅と高さの両方",
  args: {
    handles: [AxisLength.create("width", 224), AxisLength.create("height", 128)],
    scale: 1
  }
}`,...u.parameters?.docs?.source},description:{story:`artboard は 2 軸とも fixed なので、右辺と下辺の両方に帯が出る。`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "幅だけ",
  args: {
    handles: [AxisLength.create("width", 224)],
    scale: 1
  }
}`,...d.parameters?.docs?.source},description:{story:`幅だけが fixed のノード。右辺にだけ帯が出る。`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "倍率 2 倍",
  args: {
    handles: [AxisLength.create("width", 224), AxisLength.create("height", 128)],
    scale: 2
  }
}`,...f.parameters?.docs?.source},description:{story:`倍率を上げた状態。

帯の太さは倍率で割り戻すので、**中身が 2 倍に描かれても帯は見た目で同じ太さ**になる
（掴める帯は画面上の px で当たるため）。器は倍率を掛けていないので、ここでは
帯が半分の太さで出るのが正しい姿。`,...f.parameters?.docs?.description}}},p=[`BothAxes`,`WidthOnly`,`Zoomed`]}))();export{u as BothAxes,d as WidthOnly,f as Zoomed,p as __namedExportsOrder,l as default};