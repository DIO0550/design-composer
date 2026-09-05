import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-B6lWK8m9.js";function n({side:e}){return(0,r.jsx)(`span`,{"data-testid":i,"data-side":e,"aria-hidden":!0,className:`pointer-events-none absolute inset-x-0 h-0.5 bg-[#0d99ff] ${e===`before`?`top-0`:`bottom-0`}`})}var r,i,a=e((()=>{r=t(),i=`drop-line`;try{n.displayName=`DropLine`,n.__docgenInfo={description:`並べ替えで落ちる先を示す線。

UI 案（docs/Design Composer.html）は**ツリーや artboard の並べ替え**の提示を
描いていないが、キャンバスのドラッグには挿入位置の線を \`#0d99ff\`（3px）で
描いている。同じ「落ちる先を示す線」なので色をそちらへ合わせた。
Why not: キャンバスの \`DropMarker\` の緑（\`emerald-500\`）に揃えない。あちらが
緑なのは選択の枠（青）と同時に出て見分けが要るためで、左ペインでは選択の色と
同時に出ないので、UI 案のアクセント色をそのまま使える。

読み上げから外すのは、掴んで運ぶ操作がポインタ専用で、この線を読む相手が
居ないため（\`DropMarker\` も同じ理由で \`aria-hidden\`）。代わりに \`data-testid\` と
\`data-side\` を持たせて、線が出ているかと**どちら側か**をテストから読めるようにする。
class にしか出ない形にすると happy-dom では読めない。
太さと色は class にしか出ないので、確かめる手段は自分のストーリーの視覚差分だけ
（運んでいる最中の姿は左ペインのストーリーには出せない）。`,displayName:`DropLine`,filePath:`/home/runner/work/design-composer/design-composer/src/components/drop-line/index.tsx`,methods:[],props:{side:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/drop-line/index.tsx`,name:`TypeLiteral`}],description:``,name:`side`,required:!0,tags:{},type:{name:`enum`,raw:`DropSide`,value:[{value:`"before"`},{value:`"after"`}]}}},tags:{returns:`落ちる先を示す 2px の線`}}}catch{}try{i.displayName=`DropLineTestId`,i.__docgenInfo={description:"テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。",displayName:`DropLineTestId`,filePath:`/home/runner/work/design-composer/design-composer/src/components/drop-line/index.tsx`,methods:[],props:{},tags:{}}}catch{}}));export{a as n,n as t};