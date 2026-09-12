import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-4HHWW5MW.js";function n({side:e}){return(0,r.jsx)(`span`,{"data-testid":i,"data-side":e,"aria-hidden":!0,className:`pointer-events-none absolute inset-x-0 h-0.5 bg-[#0d99ff] ${e===`before`?`top-0`:`bottom-0`}`})}var r,i,a=e((()=>{r=t(),i=`drop-line`;try{n.displayName=`DropLine`,n.__docgenInfo={description:`並べ替えで落ちる先を示す線。

UI 案はツリーや artboard の並べ替えの提示を描いていないが、キャンバスのドラッグには挿
入位置の線を \`#0d99ff\`（3px）で描いているので、同じ「落ちる先を示す線」として色をそち
らへ合わせた（キャンバスの \`DropMarker\` の緑は選択の枠と同時に出るための色で、左ペイ
ンでは要らない）。

UI 案は docs/Design Composer.html。代わりに \`data-testid\` / \`data-side\` を持たせるのは、
class にしか出ない形にすると happy-dom では読めないから（太さと色は class にしか出ないの
で、確かめる手段は自分のストーリーの視覚差分だけ）。`,displayName:`DropLine`,filePath:`/home/runner/work/design-composer/design-composer/src/components/drop-line/index.tsx`,methods:[],props:{side:{defaultValue:null,declarations:[{fileName:`design-composer/src/components/drop-line/index.tsx`,name:`TypeLiteral`}],description:``,name:`side`,required:!0,tags:{},type:{name:`enum`,raw:`DropSide`,value:[{value:`"before"`},{value:`"after"`}]}}},tags:{returns:`落ちる先を示す 2px の線`}}}catch{}try{i.displayName=`DropLineTestId`,i.__docgenInfo={description:"テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。",displayName:`DropLineTestId`,filePath:`/home/runner/work/design-composer/design-composer/src/components/drop-line/index.tsx`,methods:[],props:{},tags:{}}}catch{}}));export{a as n,n as t};