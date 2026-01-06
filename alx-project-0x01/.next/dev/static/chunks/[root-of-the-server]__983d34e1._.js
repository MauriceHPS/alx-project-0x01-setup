(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
;
const UserCard = ({ id, name, username, email, address, phone, website, company })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-xl mx-auto my-6 p-6 bg-amber-50 rounded-lg shadow-lg hover: shadow-xl transition-shadow duration-300",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: " text-2xl font-semibold text-gray-800",
                        children: [
                            "User #",
                            id
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                        lineNumber: 18,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                    lineNumber: 17,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4 flex flex-col gap-1 justify-between text-gray-950/65",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "ID: ",
                                id
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 22,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Name: ",
                                name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 23,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Username: ",
                                username
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 24,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Email:"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                                    lineNumber: 26,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                " ",
                                email
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Street: ",
                                address.street
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 29,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Suite: ",
                                address.suite
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "City: ",
                                address.city
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Zip Code: ",
                                address.zipcode
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Phone: ",
                                phone
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Latitude: ",
                                address.geo.lat
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Longitude: ",
                                address.geo.lng
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Website: ",
                                website
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Name: ",
                                company.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Catch Phrase: ",
                                company.catchPhrase
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "BS: ",
                                company.bs
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
            lineNumber: 16,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false);
};
_c = UserCard;
function Field({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-bold",
                children: [
                    label,
                    ":"
                ]
            }, void 0, true, {
                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            " ",
            value
        ]
    }, void 0, true, {
        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c1 = Field;
const __TURBOPACK__default__export__ = UserCard;
var _c, _c1;
__turbopack_context__.k.register(_c, "UserCard");
__turbopack_context__.k.register(_c1, "Field");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
const UserModal = ({ onClose, onSubmit })=>{
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        id: 1,
        name: "",
        username: "",
        email: "",
        address: {
            street: "",
            suite: "",
            city: "",
            zipcode: "",
            geo: {
                lat: "",
                lng: ""
            }
        },
        phone: "",
        website: "",
        company: {
            name: "",
            catchPhrase: "",
            bs: ""
        }
    });
    const handleChange = (e)=>{
        const { name, value } = e.target;
        setUser((prevUser)=>({
                ...prevUser,
                [name]: value
            }));
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        onSubmit(user);
        onClose();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-gray-600/80 bg-opacity-50 flex justify-center items-center backdrop-brightness-50 p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg p-8 shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6 border-b sticky top-0 bg-white z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold",
                            children: "Add New User"
                        }, void 0, false, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                            lineNumber: 47,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                        lineNumber: 46,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "p-6 grid grid-cols-1 md:grid-cols-2 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col mb-4 ",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "ID",
                                        className: "text-2xl font-bold block mb-4",
                                        children: "ID"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 55,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        id: "id",
                                        name: "id",
                                        value: user.id,
                                        onChange: handleChange,
                                        className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 58,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "name",
                                        name: "name",
                                        placeholder: "Name",
                                        value: user.name,
                                        onChange: handleChange,
                                        className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 66,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 54,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4"
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 78,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "username",
                                    name: "username",
                                    placeholder: "Username",
                                    value: user.username,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "email",
                                    id: "email",
                                    name: "email",
                                    placeholder: "Email Address",
                                    value: user.email,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 95,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4  flex flex-col",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "Address",
                                        className: "text-2xl font-bold block",
                                        children: "Address"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "street",
                                        name: "street",
                                        placeholder: "Street",
                                        value: user.address.street,
                                        onChange: handleChange,
                                        className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-900/30"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 "
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "suite",
                                    name: "suite",
                                    placeholder: "Suite",
                                    value: user.address.suite,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 127,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "city",
                                    name: "city",
                                    placeholder: "City",
                                    value: user.address.city,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "zipcode",
                                    name: "zipcode",
                                    placeholder: "Zip code",
                                    value: user.address.zipcode,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 153,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "Coordinates",
                                className: "text-xl font-extrabold",
                                children: "Coordinates"
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "longitude",
                                    name: "longitude",
                                    placeholder: "Longitude",
                                    value: user.address.geo.lng,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 170,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 169,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "latitude",
                                    name: "latitude",
                                    placeholder: "Latitude",
                                    value: user.address.geo.lat,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 182,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "phone",
                                    name: "phone",
                                    placeholder: "Phone number",
                                    value: user.phone,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 195,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 194,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "website",
                                    name: "website",
                                    placeholder: "Website",
                                    value: user.website,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 207,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 206,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "companyName",
                                className: "text-2xl font-extralight",
                                children: "Company Details"
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 218,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "companyName",
                                    name: "companyName",
                                    placeholder: "Enter the company name",
                                    value: user.company.name,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 223,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "catchphrase",
                                    name: "catchphrase",
                                    placeholder: "Enter the catchphrase",
                                    value: user.company.catchPhrase,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 236,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 235,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    id: "bs",
                                    name: "bs",
                                    placeholder: "Enter your bs",
                                    value: user.company.bs,
                                    onChange: handleChange,
                                    className: "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-800/25"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                    lineNumber: 249,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 248,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: onClose,
                                        className: "px-4 py-2 text-white bg-orange-600/80 rounded-b-lg hover:bg-red-800/70 transition",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 261,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        className: "px-6 py-2 bg-blue-500 text-white rounded-b-lg hover:bg-indigo-800 transition",
                                        children: "Add User"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                        lineNumber: 268,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                                lineNumber: 260,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                        lineNumber: 49,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
                lineNumber: 45,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false);
};
_s(UserModal, "QzICXhTt75HCj3pKgCLY0WIeado=");
_c = UserModal;
const __TURBOPACK__default__export__ = UserModal;
var _c;
__turbopack_context__.k.register(_c, "UserModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/next/link.js [client] (ecmascript)");
;
;
const Header = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
            className: "bg-blue-600 text-white shadow-md py-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto flex justify-between items-center px-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-bold text-2xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            children: "Daily Content"
                        }, void 0, false, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                            lineNumber: 10,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                        lineNumber: 9,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "flex space-x-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "hover:underline",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/posts",
                                        children: "Posts"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                                        lineNumber: 15,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                                    lineNumber: 14,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    className: "hover:underline",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/users",
                                        children: "Users"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                                        lineNumber: 18,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                                    lineNumber: 17,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                            lineNumber: 13,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                        lineNumber: 12,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
                lineNumber: 8,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx",
            lineNumber: 7,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false);
};
_c = Header;
const __TURBOPACK__default__export__ = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__N_SSG",
    ()=>__N_SSG,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$common$2f$UserCard$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserCard.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$common$2f$UserModal$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/components/common/UserModal.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$layout$2f$Header$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/components/layout/Header.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-project-0x01-setup/alx-project-0x01/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const Users = ({ posts })=>{
    _s();
    const [isModalOpen, setModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleAddUser = (newUser)=>{
        setUser({
            ...newUser,
            id: posts.length + 1
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col h-screen",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$layout$2f$Header$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                    lineNumber: 18,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: "p-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "flex font-bold text-3xl text-gray-800/60",
                                    children: "Users Content"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                                    lineNumber: 21,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setModalOpen(true),
                                    className: "bg-blue-700 px-4 py-2 rounded-full text-white",
                                    children: "Add User"
                                }, void 0, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                                    lineNumber: 25,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                            lineNumber: 20,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-3 gap-2",
                            children: posts.map(({ id, name, username, email, address, phone, website, company }, key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$common$2f$UserCard$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    id: id,
                                    name: name,
                                    username: username,
                                    email: email,
                                    address: address,
                                    phone: phone,
                                    website: website,
                                    company: company
                                }, key, false, {
                                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                                    lineNumber: 48,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                isModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$project$2d$0x01$2d$setup$2f$alx$2d$project$2d$0x01$2f$components$2f$common$2f$UserModal$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                    onClose: ()=>setModalOpen(false),
                    onSubmit: handleAddUser
                }, void 0, false, {
                    fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
                    lineNumber: 65,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx",
            lineNumber: 17,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false);
};
_s(Users, "T5Mknng6cENtA6evr1g6BRyb6sU=");
_c = Users;
var __N_SSG = true;
const __TURBOPACK__default__export__ = Users;
var _c;
__turbopack_context__.k.register(_c, "Users");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/users";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/alx-project-0x01-setup/alx-project-0x01/pages/users/index.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__983d34e1._.js.map