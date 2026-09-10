import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-CTa-i89e.js";import{n as r,t as i}from"./overlay-stage-DXhokspe.js";import{n as a,t as o}from"./snap-guide-overlay-Bk4RPVOx.js";var s,c,l,u;e((()=>{t(),r(),a(),s={title:`features/canvas/ArtboardCanvas/SnapGuideOverlay`,component:o,parameters:{layout:`fullscreen`,docs:{description:{component:"揃った辺に引くガイド線（映し方は `OverlayStage` の doc を参照）。"}}},decorators:[i]},c={name:`左右の辺が揃った`,args:{guides:{horizontal:n.some({left:159,top:40,width:2,height:140}),vertical:n.none}}},l={name:`縦横の両方で揃った`,args:{guides:{horizontal:n.some({left:159,top:40,width:2,height:140}),vertical:n.some({left:60,top:99,width:240,height:2})}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "左右の辺が揃った",
  args: {
    guides: {
      horizontal: Option.some({
        left: 159,
        top: 40,
        width: 2,
        height: 140
      }),
      vertical: Option.none
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "縦横の両方で揃った",
  args: {
    guides: {
      horizontal: Option.some({
        left: 159,
        top: 40,
        width: 2,
        height: 140
      }),
      vertical: Option.some({
        left: 60,
        top: 99,
        width: 240,
        height: 2
      })
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。`,...l.parameters?.docs?.description}}},u=[`AlongSideEdges`,`AlongBothAxes`]}))();export{l as AlongBothAxes,c as AlongSideEdges,u as __namedExportsOrder,s as default};