import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./overlay-stage-DXhokspe.js";import{n as r,t as i}from"./range-select-overlay-ot5sa0qY.js";var a,o,s,c;e((()=>{t(),r(),a={title:`features/canvas/ArtboardCanvas/RangeSelectOverlay`,component:i,parameters:{layout:`fullscreen`,docs:{description:{component:"空き領域から引いている選択の範囲（映し方は `OverlayStage` の doc を参照）。\n引いている最中にしか出ないので、線の太さ・色・塗りの濃さを確かめる手段はここだけ。"}}},decorators:[n]},o={name:`範囲を引いている`,args:{bounds:{left:40,top:30,width:240,height:140}}},s={name:`細く引いている`,args:{bounds:{left:40,top:30,width:320,height:24}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "範囲を引いている",
  args: {
    bounds: {
      left: 40,
      top: 30,
      width: 240,
      height: 140
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`右下へ引いている途中。`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "細く引いている",
  args: {
    bounds: {
      left: 40,
      top: 30,
      width: 320,
      height: 24
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`細く引いたとき。塗りが薄いので、線が無いと辺を見失う。`,...s.parameters?.docs?.description}}},c=[`Drawing`,`Narrow`]}))();export{o as Drawing,s as Narrow,c as __namedExportsOrder,a as default};