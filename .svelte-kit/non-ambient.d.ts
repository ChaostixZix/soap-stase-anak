
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/bangsal" | "/api/bangsal/[id]" | "/api/hospitals" | "/api/hospitals/[id]" | "/api/nl" | "/api/patients" | "/api/patients/[patient_id]" | "/api/patients/[id]" | "/api/patients/[patient_id]/soap" | "/api/patients/[patient_id]/soap/latest" | "/api/soap" | "/api/soap/[soap_id]" | "/api/soap/[soap_id]/plan-items" | "/api/soap/[soap_id]/recompute-plan" | "/auth" | "/auth/callback" | "/login" | "/webhooks" | "/webhooks/telegram";
		RouteParams(): {
			"/api/bangsal/[id]": { id: string };
			"/api/hospitals/[id]": { id: string };
			"/api/patients/[patient_id]": { patient_id: string };
			"/api/patients/[id]": { id: string };
			"/api/patients/[patient_id]/soap": { patient_id: string };
			"/api/patients/[patient_id]/soap/latest": { patient_id: string };
			"/api/soap/[soap_id]": { soap_id: string };
			"/api/soap/[soap_id]/plan-items": { soap_id: string };
			"/api/soap/[soap_id]/recompute-plan": { soap_id: string }
		};
		LayoutParams(): {
			"/": { id?: string; patient_id?: string; soap_id?: string };
			"/api": { id?: string; patient_id?: string; soap_id?: string };
			"/api/bangsal": { id?: string };
			"/api/bangsal/[id]": { id: string };
			"/api/hospitals": { id?: string };
			"/api/hospitals/[id]": { id: string };
			"/api/nl": Record<string, never>;
			"/api/patients": { patient_id?: string; id?: string };
			"/api/patients/[patient_id]": { patient_id: string };
			"/api/patients/[id]": { id: string };
			"/api/patients/[patient_id]/soap": { patient_id: string };
			"/api/patients/[patient_id]/soap/latest": { patient_id: string };
			"/api/soap": { soap_id?: string };
			"/api/soap/[soap_id]": { soap_id: string };
			"/api/soap/[soap_id]/plan-items": { soap_id: string };
			"/api/soap/[soap_id]/recompute-plan": { soap_id: string };
			"/auth": Record<string, never>;
			"/auth/callback": Record<string, never>;
			"/login": Record<string, never>;
			"/webhooks": Record<string, never>;
			"/webhooks/telegram": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/bangsal" | "/api/bangsal/" | `/api/bangsal/${string}` & {} | `/api/bangsal/${string}/` & {} | "/api/hospitals" | "/api/hospitals/" | `/api/hospitals/${string}` & {} | `/api/hospitals/${string}/` & {} | "/api/nl" | "/api/nl/" | "/api/patients" | "/api/patients/" | `/api/patients/${string}` & {} | `/api/patients/${string}/` & {} | `/api/patients/${string}/soap` & {} | `/api/patients/${string}/soap/` & {} | `/api/patients/${string}/soap/latest` & {} | `/api/patients/${string}/soap/latest/` & {} | "/api/soap" | "/api/soap/" | `/api/soap/${string}` & {} | `/api/soap/${string}/` & {} | `/api/soap/${string}/plan-items` & {} | `/api/soap/${string}/plan-items/` & {} | `/api/soap/${string}/recompute-plan` & {} | `/api/soap/${string}/recompute-plan/` & {} | "/auth" | "/auth/" | "/auth/callback" | "/auth/callback/" | "/login" | "/login/" | "/webhooks" | "/webhooks/" | "/webhooks/telegram" | "/webhooks/telegram/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | string & {};
	}
}