import { writable } from 'svelte/store';
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);

// Initialize auth state
supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
	session.set(initialSession);
	user.set(initialSession?.user ?? null);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, newSession) => {
	session.set(newSession);
	user.set(newSession?.user ?? null);
});

export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('Error signing out:', error);
	}
}