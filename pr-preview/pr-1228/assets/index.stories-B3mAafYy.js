import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./Option-BeyCqz6s.js";import{i as r,n as i}from"./side-BH3aONF_.js";import{l as a,u as o}from"./side-snap-DPsTyUUX.js";import{i as s,r as c}from"./snap-guide-overlay-DXAQ2cEb.js";import{n as l,t as u}from"./overlay-stage-C4Ntna6K.js";var d,f,p,m,h;e((()=>{r(),o(),t(),l(),s(),d={title:`features/editor/features/canvas/ArtboardCanvas/SnapGuideOverlay`,component:c,parameters:{layout:`fullscreen`,docs:{description:{component:"揃った線（辺か中心線）に引くガイド線と、揃え先との隙間（映し方は `OverlayStage` の doc を参照）。"}}},decorators:[u]},f={name:`左右の辺が揃った`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:140},gapLine:n.none}),vertical:n.none},view:a.create()}},p={name:`縦横の両方で揃った`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:140},gapLine:n.none}),vertical:n.some({guideLine:{left:60,top:99,width:240,height:2},gapLine:n.none})},view:a.create()}},m={name:`揃え先との隙間の数値`,args:{guides:{horizontal:n.some({guideLine:{left:159,top:40,width:2,height:160},gapLine:n.some({along:i.Vertical,at:180,span:{min:80,max:144}})}),vertical:n.some({guideLine:{left:60,top:199,width:280,height:2},gapLine:n.some({along:i.Horizontal,at:200,span:{min:200,max:300}})})},view:a.create()}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "左右の辺が揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 140
        },
        gapLine: Option.none
      }),
      vertical: Option.none
    },
    view: CanvasView.create()
  }
}`,...f.parameters?.docs?.source},description:{story:`左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。揃え先とは重なっている。`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "縦横の両方で揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 140
        },
        gapLine: Option.none
      }),
      vertical: Option.some({
        guideLine: {
          left: 60,
          top: 99,
          width: 240,
          height: 2
        },
        gapLine: Option.none
      })
    },
    view: CanvasView.create()
  }
}`,...p.parameters?.docs?.source},description:{story:`縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。揃え先とはどちらも重なっている。`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "揃え先との隙間の数値",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: {
          left: 159,
          top: 40,
          width: 2,
          height: 160
        },
        gapLine: Option.some({
          along: SidePairs.Vertical,
          at: 180,
          span: {
            min: 80,
            max: 144
          }
        })
      }),
      vertical: Option.some({
        guideLine: {
          left: 60,
          top: 199,
          width: 280,
          height: 2
        },
        gapLine: Option.some({
          along: SidePairs.Horizontal,
          at: 200,
          span: {
            min: 200,
            max: 300
          }
        })
      })
    },
    view: CanvasView.create()
  }
}`,...m.parameters?.docs?.source},description:{story:`揃え先と縦横それぞれに離れているとき。隙間に短い線が引かれ、その中点に隙間の数値が出る。
縦の隙間は向かい合う範囲の中央（ガイド線とは別の位置）、横の隙間はガイド線に重なる位置。`,...m.parameters?.docs?.description}}},h=[`AlongSideEdges`,`AlongBothAxes`,`WithGaps`]}))();export{p as AlongBothAxes,f as AlongSideEdges,m as WithGaps,h as __namedExportsOrder,d as default};