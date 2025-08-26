declare global {
	namespace App {
		interface Error {}
		interface Locals {}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

declare module '$env/static/private' {
	export const SUPABASE_SERVICE_ROLE_KEY: string;
	export const TELEGRAM_BOT_TOKEN: string;
	export const TELEGRAM_WEBHOOK_SECRET: string;
}

export {};