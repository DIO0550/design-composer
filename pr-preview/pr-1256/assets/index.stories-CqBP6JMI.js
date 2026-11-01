import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DweqXWlm.js";import{i as n,r}from"./ArrayEx-HCexD8pK.js";import{n as i,t as a}from"./Option-CO7Q4TcL.js";import{n as o,r as s,t as c}from"./document-error-list-Bc50ANkH.js";import{i as l,n as u,r as d,t as f}from"./file-paths-yodTPgjW.js";import{n as p,t as ee}from"./document-json-otLBq7lG.js";import{i as te,n as ne,r as re,t as ie}from"./document-tab-bar-COeA5Myd.js";import{f as ae,g as oe,h as se,m as ce}from"./elapsed-BOWeJrMe.js";import{S as le,_ as ue,b as m,v as h,y as de}from"./use-node-drag-DI71eeA7.js";import{a as fe,c as g,i as pe,l as _,n as me,o as he,r as ge,s as v,t as _e}from"./opened-document-editor-DDydJZi_.js";import{a as y,i as b}from"./document-ipc-DZQjWSgy.js";import{a as ve,c as ye,i as be,l as xe,n as Se,o as x,t as Ce,u as we}from"./document-start-DYtysaHF.js";import{n as Te,t as S}from"./opened-documents-CKL1iSNk.js";import{i as Ee,t as De}from"./document-open-failure-DrWzXEBh.js";function C(e){let t=Object.values(T).find(t=>t===e);return a.fromNullable(t)}function w(e){return{async subscribeCommand(t){try{let n=await e.listen(E,e=>{let n=C(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var T,E,Oe=e((()=>{i(),n(),T={Open:`open`,Create:`create`,CloseTab:`close-tab`},E=`document-menu`}));function ke(){let e=v(E);return{menu:w(e.ipc),choose:e.deliver,deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}var Ae=e((()=>{g(),Oe()}));function je(e){return{message:b.toFailureMessage(e)}}function Me(e){return e===null?r.ok(a.none):typeof e==`string`?r.ok(a.some(e)):r.err({message:`load_app_state が文字列でも null でもない値を返した: ${String(e)}`})}function Ne(e){let t=b.caller(e,je);return{async load(){return r.flatMap(await t(`load_app_state`,{}),Me)},async save(e){return r.map(await t(`save_app_state`,{content:e}),()=>void 0)}}}var Pe=e((()=>{y(),i(),n()}));function D(e){return Promise.reject({message:`app-state.json: ${e}`})}function Fe(e){let t=e,n=!1,r=!1,i=()=>n?D(`読み込みが拒まれた`):Promise.resolve(t??null),o=e=>typeof e==`string`?r?D(`書き込みが拒まれた`):(t=e,Promise.resolve(void 0)):_(`save_app_state: content が文字列でない`);return{ipc:Ne({invoke(e,t){switch(e){case`load_app_state`:return i();case`save_app_state`:return o(t.content);default:return _(`Command ${e} not found`)}},listen(e){return _(`Event ${e} not emitted`)}}),storedContent(){return a.fromNullable(t)},denyLoad(){n=!0},denySave(){r=!0}}}var Ie=e((()=>{g(),i(),Pe()}));function Le(e){let t=b.caller(e,e=>({message:String(e)}));return{async close(){return r.map(await t(`close_current_window`,{}),()=>void 0)}}}var Re=e((()=>{y(),n()}));function ze(){let e=!1,t=!1,n=()=>t?_(`close_current_window: ウィンドウを閉じられない`):(e=!0,Promise.resolve(void 0));return{appWindow:Le({invoke(e){return e===`close_current_window`?n():_(`Command ${e} not found`)},listen(e){return _(`Event ${e} not emitted`)}}),isWindowClosed(){return e},denyClose(){t=!0}}}var Be=e((()=>{g(),Re()}));function Ve(e){return{message:b.toFailureMessage(e)}}function He(e,t){if(t===null)return r.ok(a.none);if(typeof t!=`string`)return r.err({message:`${e} が文字列以外を返した: ${String(t)}`});let n=d.create(t);return a.isSome(n)?r.ok(n):r.err({message:`選ばれたパスがファイル名を持たない: ${t}`})}function Ue(e){let t=b.caller(e,Ve),n=async e=>r.flatMap(await t(e,{}),t=>He(e,t));return{chooseOpenPath(){return n(`choose_open_document_path`)},chooseSavePath(){return n(`choose_save_document_path`)}}}var O=e((()=>{l(),y(),i(),n()}));function k(e){switch(e.kind){case`chosen`:return Promise.resolve(e.path);case`canceled`:return Promise.resolve(null);case`refused`:return Promise.reject({kind:`invalidPath`,message:e.message});case`failed`:return _(e.message)}}function We(e){return{dialog:Ue({invoke(t){switch(t){case`choose_open_document_path`:return k(e.open);case`choose_save_document_path`:return k(e.save);default:return _(`Command ${t} not found`)}},listen(e){return _(`Event ${e} not emitted`)}})}}var A,j,Ge=e((()=>{g(),O(),A={kind:`canceled`},j={Canceled:A,chosen(e){return{kind:`chosen`,path:e}},refused(e){return{kind:`refused`,message:e}},failed(e){return{kind:`failed`,message:e}}}}));function Ke(e){if(typeof e!=`object`||!e)return a.none;let{paths:t}=e;if(!Array.isArray(t)||!t.every(e=>typeof e==`string`))return a.none;let n=t.flatMap(e=>{let t=d.create(e);return a.isSome(t)?[t.value]:[]});return n.length>0?a.some(n):a.none}function qe(e){return{async subscribeDropped(t){try{let n=await e.listen(M,e=>{let n=Ke(e);a.isSome(n)&&t(n.value)});return r.ok(n)}catch(e){return r.err({message:String(e)})}}}}var M,Je=e((()=>{l(),i(),n(),M=`document-dropped`}));function Ye(){let e=v(M);return{drop:qe(e.ipc),dropFiles(t){e.deliver({paths:[...t]})},deliverUnknown:e.deliver,denySubscribe:e.denySubscribe}}var Xe=e((()=>{g(),Je()})),Ze=e((()=>{Ee(),Se(),ne(),ye(),be()}));function Qe(e){le(Array.from({length:N},(t,n)=>({shortcut:{kind:de.PhysicalKey,codes:[`Digit${n+1}`],withCommandKey:!0,withShiftKey:!1},onPress:()=>e(n)})))}var N,$e=e((()=>{m(),N=9}));function et({opened:e,clock:t,ipc:n}){let r=S.activePath(e);return(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:S.documents(e).map(e=>{let i=e.path===r;return(0,F.jsx)(`div`,{hidden:!i,className:`h-full`,children:(0,F.jsx)(ue,{scope:i?h.Listening:h.Suspended,children:(0,F.jsx)(_e,{clock:t,ipc:n,opened:e})})},e.path)})})}function P({clock:e,ports:t}){let{session:n,recentPaths:r,recentFilesFailure:i,actions:s,tabActions:l,commandFailure:u}=ve(t),d=x.failure(n);return Qe(l.activateAt),x.hasOpenedDocuments(n)?(0,F.jsxs)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:[(0,F.jsx)(ie,{opened:n.documents.value,onSelect:l.activate,onClose:l.close,onReorder:l.reorder}),a.isSome(d)&&(0,F.jsx)(De,{failure:d.value}),(0,F.jsx)(et,{opened:n.documents.value,clock:e,ipc:t.ipc})]}):(0,F.jsx)(`div`,{className:`flex h-screen w-screen flex-col overflow-hidden`,children:(0,F.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,F.jsx)(Ce,{attempt:n.attempt,actions:s,recentPaths:r,recentFilesFailure:i,commandFailure:u,renderErrors:e=>(0,F.jsx)(c,{errors:e,origin:o.UnopenedFile})})})})}var F,tt=e((()=>{Te(),s(),me(),Ze(),$e(),m(),i(),F=t();try{P.displayName=`EditorScreen`,P.__docgenInfo={description:`アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
（docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。

実物の組み立ては \`app/\` が持つ（rules/architecture.md）。`,displayName:`EditorScreen`,filePath:`/home/runner/work/design-composer/design-composer/src/features/editor/components/editor-screen/index.tsx`,methods:[],props:{clock:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`clock`,required:!0,tags:{},type:{name:`Readonly<{ now(): Readonly<{ epochMs: number; }>; subscribeSeconds(listener: () => void): () => void; }>`}},ports:{defaultValue:null,declarations:[{fileName:`design-composer/src/features/editor/components/editor-screen/index.tsx`,name:`TypeLiteral`}],description:``,name:`ports`,required:!0,tags:{},type:{name:`Readonly<{ ipc: Readonly<{ canonicalize(path: FilePath): Promise<Result<FilePath, Readonly<{ kind: DocumentIpcErrorKind; message: string; }>>>; ... 4 more ...; subscribeChanged(listener: (changed: Readonly<...>) => void): Promise<...>; }>; ... 4 more ...; appWindow: Readonly<...>; }>`}}},tags:{}}}catch{}}));function I(e,t){let n=ge(e),r=We({open:j.chosen(B),save:j.chosen(`/work/untitled.dcmp`)}),i=Ye(),a=Fe(t===void 0?void 0:xe.serialize({recentPaths:t}));return{ports:{ipc:n.ipc,dialog:r.dialog,menu:ke().menu,drop:i.drop,appState:a.ipc,appWindow:ze().appWindow},drop:i}}var L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{u(),te(),ce(),oe(),Ae(),Ie(),we(),Be(),he(),Ge(),pe(),p(),Xe(),tt(),{expect:L,screen:R,waitFor:z}=__STORYBOOK_MODULE_TEST__,B=f(`/work/sample.dcmp`),V=f(`/work/settings.dcmp`),H=f(`/work/missing.dcmp`),U={[B]:ee.serialize(se.document(ae)),[V]:re(`settings`)},W=I(U),G=I(U),K=I(U),q=I(U,[B]),J={title:`features/editor/EditorScreen`,component:P,parameters:{layout:`fullscreen`},args:{clock:fe().clock,ports:W.ports}},Y={name:`開始画面`},X={name:`前回のファイルを開いた直後`,args:{ports:q.ports}},Z={name:`複数開いている`,args:{ports:G.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),G.drop.dropFiles([B,V]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()})}},Q={name:`開いたまま開けなかった`,args:{ports:K.ports},play:async()=>{await z(()=>{L(R.getByRole(`button`,{name:`開く`}).hasAttribute(`disabled`)).toBe(!1)}),K.drop.dropFiles([B]),await z(()=>{L(R.getByRole(`navigation`,{name:`開いているドキュメント`})).toBeDefined()}),K.drop.dropFiles([H]),await z(()=>{L(R.getByRole(`alert`,{name:`ファイルを開けませんでした`})).toBeDefined()})}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "開始画面"
}`,...Y.parameters?.docs?.source},description:{story:`何も開いていない状態の画面。「開く」でサンプルのドキュメントが、
「新規作成」で雛形のドキュメントが開くところまでここで操作して確認できる。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "前回のファイルを開いた直後",
  args: {
    ports: restored.ports
  }
}`,...X.parameters?.docs?.source},description:{story:`前回開いていたファイルが起動時にそのまま開いた状態。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "複数開いている",
  args: {
    ports: twoOpened.ports
  },
  play: async () => {
    // 購読が張られる前に落とすと指示が届かないので、張れるまで待つ。
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    twoOpened.drop.dropFiles([SamplePath, SettingsPath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
  }
}`,...Z.parameters?.docs?.source},description:{story:`2 つ開いた状態。タブ列と上端の帯と 3 ペインの高さの配分は、ここでしか絵にならない
（タブ列だけのストーリーでは器との合わせ目が映らない）。`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "開いたまま開けなかった",
  args: {
    ports: openFailed.ports
  },
  play: async () => {
    await waitFor(() => {
      expect(screen.getByRole("button", {
        name: "開く"
      }).hasAttribute("disabled")).toBe(false);
    });
    openFailed.drop.dropFiles([SamplePath]);
    await waitFor(() => {
      expect(screen.getByRole("navigation", {
        name: "開いているドキュメント"
      })).toBeDefined();
    });
    // 置かれていないファイルを落とす。タブは増えず、理由だけが帯に出る。
    openFailed.drop.dropFiles([MissingPath]);
    await waitFor(() => {
      expect(screen.getByRole("alert", {
        name: "ファイルを開けませんでした"
      })).toBeDefined();
    });
  }
}`,...Q.parameters?.docs?.source},description:{story:`開いているものがある状態で、別のファイルを開けなかったところ。タブは残したまま
理由だけを帯で出す。`,...Q.parameters?.docs?.description}}},$=[`Default`,`RestoredDocument`,`MultipleDocuments`,`OpenFailedWhileOpened`]}))();export{Y as Default,Z as MultipleDocuments,Q as OpenFailedWhileOpened,X as RestoredDocument,$ as __namedExportsOrder,J as default};