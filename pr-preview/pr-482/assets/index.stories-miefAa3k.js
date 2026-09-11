import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./overlay-stage-BshQrc4J.js";import{n as r,t as i}from"./drop-marker-56cOHIzZ.js";var a,o,s,c;e((()=>{t(),r(),a={title:`features/canvas/ArtboardCanvas/DropMarker`,component:i,parameters:{layout:`fullscreen`,docs:{description:{component:"ドロップ先を示す線（映し方は `OverlayStage` の doc を参照）。"}}},decorators:[n]},o={name:`横並びの子の間`,args:{bounds:{left:160,top:40,width:2,height:120}}},s={name:`縦並びの子の間`,args:{bounds:{left:60,top:100,width:240,height:2}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "横並びの子の間",
  args: {
    bounds: {
      left: 160,
      top: 40,
      width: 2,
      height: 120
    }
  }
}`,...o.parameters?.docs?.source},description:{story:"子が横に並ぶ親（`row`）へ落とすときの線。子と子の隙間に縦線が立つ。",...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "縦並びの子の間",
  args: {
    bounds: {
      left: 60,
      top: 100,
      width: 240,
      height: 2
    }
  }
}`,...s.parameters?.docs?.source},description:{story:"子が縦に並ぶ親（`column`）へ落とすときの線。",...s.parameters?.docs?.description}}},c=[`BetweenColumns`,`BetweenRows`]}))();export{o as BetweenColumns,s as BetweenRows,c as __namedExportsOrder,a as default};