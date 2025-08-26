
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const GOOGLE_API_KEY: string;
	export const SUPABASE_SERVICE_ROLE_KEY: string;
	export const SUPABASE_PROJECT_REF: string;
	export const TZ: string;
	export const USER: string;
	export const npm_config_user_agent: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const GIT_EDITOR: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const npm_config_noproxy: string;
	export const PORT: string;
	export const HOME: string;
	export const npm_package_json: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const NODE_NO_WARNINGS: string;
	export const SSL_CERT_FILE: string;
	export const npm_config_yes: string;
	export const SYSTEMD_EXEC_PID: string;
	export const COLOR: string;
	export const LOGNAME: string;
	export const npm_config_npm_version: string;
	export const npm_config_prefix: string;
	export const JOURNAL_STREAM: string;
	export const _: string;

	export const RUST_LOG: string;

	export const npm_config_cache: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NODE: string;
	export const INVOCATION_ID: string;
	export const npm_package_name: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const SSL_CERT_DIR: string;
	export const LANG: string;
	export const npm_lifecycle_script: string;
	export const SHELL: string;
	export const npm_package_version: string;
	export const HOST: string;
	export const npm_lifecycle_event: string;
	export const CLAUDECODE: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const npm_config_global_prefix: string;
	export const npm_command: string;
	export const CODEX_MANAGED_BY_NPM: string;
	export const EDITOR: string;
	export const INIT_CWD: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		GOOGLE_API_KEY: string;
		SUPABASE_SERVICE_ROLE_KEY: string;
		SUPABASE_PROJECT_REF: string;
		TZ: string;
		USER: string;
		npm_config_user_agent: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		GIT_EDITOR: string;
		npm_node_execpath: string;
		SHLVL: string;
		npm_config_noproxy: string;
		PORT: string;
		HOME: string;
		npm_package_json: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		NODE_NO_WARNINGS: string;
		SSL_CERT_FILE: string;
		npm_config_yes: string;
		SYSTEMD_EXEC_PID: string;
		COLOR: string;
		LOGNAME: string;
		npm_config_npm_version: string;
		npm_config_prefix: string;
		JOURNAL_STREAM: string;
		_: string;
		RUST_LOG: string;
		npm_config_cache: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_config_node_gyp: string;
		PATH: string;
		NODE: string;
		INVOCATION_ID: string;
		npm_package_name: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		SSL_CERT_DIR: string;
		LANG: string;
		npm_lifecycle_script: string;
		SHELL: string;
		npm_package_version: string;
		HOST: string;
		npm_lifecycle_event: string;
		CLAUDECODE: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		npm_execpath: string;
		npm_config_global_prefix: string;
		npm_command: string;
		CODEX_MANAGED_BY_NPM: string;
		EDITOR: string;
		INIT_CWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
