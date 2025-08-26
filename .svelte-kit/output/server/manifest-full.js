export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.D5yPRAIO.js",app:"_app/immutable/entry/app.CmEa08Ut.js",imports:["_app/immutable/entry/start.D5yPRAIO.js","_app/immutable/chunks/D42KGYS3.js","_app/immutable/chunks/TMsUfOpP.js","_app/immutable/chunks/BY-ePNvO.js","_app/immutable/entry/app.CmEa08Ut.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/TMsUfOpP.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/bangsal",
				pattern: /^\/api\/bangsal\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bangsal/_server.ts.js'))
			},
			{
				id: "/api/bangsal/[id]",
				pattern: /^\/api\/bangsal\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bangsal/_id_/_server.ts.js'))
			},
			{
				id: "/api/hospitals",
				pattern: /^\/api\/hospitals\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/hospitals/_server.ts.js'))
			},
			{
				id: "/api/hospitals/[id]",
				pattern: /^\/api\/hospitals\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/hospitals/_id_/_server.ts.js'))
			},
			{
				id: "/api/patients",
				pattern: /^\/api\/patients\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/patients/_server.ts.js'))
			},
			{
				id: "/api/patients/[id]",
				pattern: /^\/api\/patients\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/patients/_id_/_server.ts.js'))
			},
			{
				id: "/api/patients/[patient_id]/soap",
				pattern: /^\/api\/patients\/([^/]+?)\/soap\/?$/,
				params: [{"name":"patient_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/patients/_patient_id_/soap/_server.ts.js'))
			},
			{
				id: "/api/patients/[patient_id]/soap/latest",
				pattern: /^\/api\/patients\/([^/]+?)\/soap\/latest\/?$/,
				params: [{"name":"patient_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/patients/_patient_id_/soap/latest/_server.ts.js'))
			},
			{
				id: "/api/soap/[soap_id]",
				pattern: /^\/api\/soap\/([^/]+?)\/?$/,
				params: [{"name":"soap_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/soap/_soap_id_/_server.ts.js'))
			},
			{
				id: "/api/soap/[soap_id]/plan-items",
				pattern: /^\/api\/soap\/([^/]+?)\/plan-items\/?$/,
				params: [{"name":"soap_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/soap/_soap_id_/plan-items/_server.ts.js'))
			},
			{
				id: "/api/soap/[soap_id]/recompute-plan",
				pattern: /^\/api\/soap\/([^/]+?)\/recompute-plan\/?$/,
				params: [{"name":"soap_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/soap/_soap_id_/recompute-plan/_server.ts.js'))
			},
			{
				id: "/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/bangsal",
				pattern: /^\/bangsal\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/hospitals",
				pattern: /^\/hospitals\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
