import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";import{n,r}from"./artboard-frame-list-Dgu12o6O.js";function i({bounds:e}){return(0,a.jsx)(`div`,{"data-testid":`range-select`,"aria-hidden":!0,className:`pointer-events-none fixed z-10`,style:{left:`${e.left}px`,top:`${e.top}px`,width:`${e.width}px`,height:`${e.height}px`,border:`1px solid ${n}`,backgroundColor:`${n}1a`}})}var a,o=e((()=>{r(),a=t();try{i.displayName=`RangeSelectOverlay`,i.__docgenInfo={description:`空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。

色は選択の枠と同じ青（\`SelectionColor\`）。この矩形が示すのは**これから選ばれる範囲**で、
選択そのものと同じ意味の系統に属する。緑（落とし先の枠）と赤（辺のスナップ）は
運んでいる間に出るもので、範囲選択とは同時に出ない。塗りを薄く敷くのは、線だけだと
中身の上で辺を見失うため。UI 案（docs/Design Composer.html）にこの状態の絵は無い。

ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま \`position: fixed\` で
使う（\`DropMarker\` / \`SnapGuideOverlay\` と同じ理由 — 変形の内側は React の管理外）。
そのため引いたまま左右のペインの上まで出ると矩形もそこへ伸びるが、器からの相対へ
直すにはレンダー中に器を実測する必要があり、実測を持つ \`useDrawnBounds\` は名前で引く
形なので噛み合わない。引いている間だけの一過性の見え方なので、そのままにしている。

\`pointer-events-none\` は、この矩形が土台（\`canvas-surface\`）の**兄弟**として重なるため。
受けてしまうと、矩形に乗ったポインタのイベントが土台まで上がらない。引いている間は
土台がポインタを捕捉していて \`target\` が固定されるので**外してもテストも絵も変わらない**が、
捕捉が成立しない場面では矩形がイベントを飲み込む。`,displayName:`RangeSelectOverlay`,filePath:`/home/runner/work/design-composer/design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,methods:[],props:{bounds:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/canvas/components/artboard-canvas/range-select-overlay/index.tsx`,name:`TypeLiteral`}],description:``,name:`bounds`,required:!0,tags:{},type:{name:`Readonly<{ left: number; top: number; width: number; height: number; }>`}}},tags:{returns:`引いている範囲を示す矩形`}}}catch{}}));export{o as n,i as t};