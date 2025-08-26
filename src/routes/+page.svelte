<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';
	import Modal from '$lib/components/Modal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { Hospital, Bangsal, Patient } from '$lib/db';

	// Extended Patient type with joined data from API
	interface PatientWithRelations extends Patient {
		hospital?: { id: string; name: string };
		bangsal?: { id: string; name: string };
	}

	let hospitals: Hospital[] = [];
	let bangsalList: Bangsal[] = [];
	let patients: PatientWithRelations[] = [];
	let loading = true;
	let patientsLoading = false;
	let submitting = false;

	// Filter state
	let selectedHospitalId: string = '';
	let selectedBangsalId: string = '';
	let searchTerm: string = '';
	let searchTimeout: NodeJS.Timeout;

	// Patient creation modal
	let showPatientModal = false;
	let newPatient = {
		full_name: '',
		mrn: '',
		room_number: '',
		hospital_id: '',
		bangsal_id: ''
	};

	$: selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);
	$: filteredBangsalList = bangsalList.filter((b) => b.hospital_id === selectedHospitalId);

	onMount(() => {
		// Load URL params
		const hospitalId = $page.url.searchParams.get('hospital');
		const bangsalId = $page.url.searchParams.get('bangsal');
		const search = $page.url.searchParams.get('search');

		if (hospitalId) selectedHospitalId = hospitalId;
		if (bangsalId) selectedBangsalId = bangsalId;
		if (search) searchTerm = search;

		loadInitialData();
	});

	// Update URL when filters change
	$: updateURLParams(selectedHospitalId, selectedBangsalId, searchTerm);

	function updateURLParams(hospitalId: string, bangsalId: string, search: string) {
		if (typeof window === 'undefined') return;

		const url = new URL($page.url);
		
		if (hospitalId) {
			url.searchParams.set('hospital', hospitalId);
		} else {
			url.searchParams.delete('hospital');
		}

		if (bangsalId) {
			url.searchParams.set('bangsal', bangsalId);
		} else {
			url.searchParams.delete('bangsal');
		}

		if (search.trim()) {
			url.searchParams.set('search', search.trim());
		} else {
			url.searchParams.delete('search');
		}

		goto(url.toString(), { replaceState: true });
	}

	async function loadInitialData() {
		try {
			loading = true;
			await Promise.all([loadHospitals(), loadBangsal()]);
			
			// Load patients after we have the filter data
			if (selectedHospitalId || selectedBangsalId || searchTerm) {
				loadPatients();
			}
		} catch (error) {
			console.error('Error loading initial data:', error);
		} finally {
			loading = false;
		}
	}

	async function loadHospitals() {
		const response = await fetch('/api/hospitals');
		const data = await response.json();

		if (data.ok) {
			hospitals = data.data || [];
		} else {
			if (response.status === 403) {
				toasts.add({
					type: 'error',
					message: 'Anda tidak punya akses untuk melihat rumah sakit'
				});
			}
		}
	}

	async function loadBangsal() {
		const response = await fetch('/api/bangsal');
		const data = await response.json();

		if (data.ok) {
			bangsalList = data.data || [];
		} else {
			if (response.status === 403) {
				toasts.add({
					type: 'error',
					message: 'Anda tidak punya akses untuk melihat bangsal'
				});
			}
		}
	}

	async function loadPatients() {
		try {
			patientsLoading = true;

			const params = new URLSearchParams();
			if (selectedHospitalId) params.append('hospital_id', selectedHospitalId);
			if (selectedBangsalId) params.append('bangsal_id', selectedBangsalId);
			if (searchTerm.trim()) params.append('search', searchTerm.trim());

			const response = await fetch(`/api/patients?${params}`);
			const data = await response.json();

			if (data.ok) {
				patients = data.data || [];
			} else {
				if (response.status === 403) {
					toasts.add({
						type: 'error',
						message: 'Anda tidak punya akses untuk melihat pasien'
					});
				} else {
					toasts.add({
						type: 'error',
						message: data.error || 'Gagal memuat data pasien'
					});
				}
				patients = [];
			}
		} catch (error) {
			console.error('Error loading patients:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat memuat data pasien'
			});
			patients = [];
		} finally {
			patientsLoading = false;
		}
	}

	// Debounced search
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (selectedHospitalId || selectedBangsalId || searchTerm.trim()) {
				loadPatients();
			}
		}, 300);
	}

	function handleHospitalChange() {
		selectedBangsalId = ''; // Reset bangsal when hospital changes
		if (selectedHospitalId) {
			loadPatients();
		} else {
			patients = [];
		}
	}

	function handleBangsalChange() {
		if (selectedHospitalId || selectedBangsalId) {
			loadPatients();
		}
	}

	function openCreatePatientModal() {
		newPatient = {
			full_name: '',
			mrn: '',
			room_number: '',
			hospital_id: selectedHospitalId,
			bangsal_id: selectedBangsalId
		};
		showPatientModal = true;
	}

	function closePatientModal() {
		showPatientModal = false;
		newPatient = {
			full_name: '',
			mrn: '',
			room_number: '',
			hospital_id: '',
			bangsal_id: ''
		};
	}

	async function handleCreatePatient() {
		if (!newPatient.full_name.trim()) {
			toasts.add({
				type: 'error',
				message: 'Nama pasien harus diisi'
			});
			return;
		}

		if (!newPatient.hospital_id || !newPatient.bangsal_id) {
			toasts.add({
				type: 'error',
				message: 'Pilih rumah sakit dan bangsal'
			});
			return;
		}

		try {
			submitting = true;

			const response = await fetch('/api/patients', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					full_name: newPatient.full_name.trim(),
					mrn: newPatient.mrn.trim() || undefined,
					room_number: newPatient.room_number.trim() || undefined,
					hospital_id: newPatient.hospital_id,
					bangsal_id: newPatient.bangsal_id
				})
			});

			const data = await response.json();

			if (!data.ok) {
				toasts.add({
					type: 'error',
					message: data.error || 'Gagal menambahkan pasien'
				});
				return;
			}

			// Add to patients list optimistically
			patients = [data.data, ...patients];
			toasts.add({
				type: 'success',
				message: 'Pasien berhasil ditambahkan'
			});

			closePatientModal();
		} catch (error) {
			console.error('Error creating patient:', error);
			toasts.add({
				type: 'error',
				message: 'Terjadi kesalahan saat menambahkan pasien'
			});
		} finally {
			submitting = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - SOAP Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="md:flex md:items-center md:justify-between mb-6">
		<div class="flex-1 min-w-0">
			<h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Dashboard Pasien</h2>
			<p class="mt-1 text-sm text-gray-500">Kelola dan cari pasien berdasarkan rumah sakit dan bangsal</p>
		</div>
		<div class="mt-4 flex md:mt-0 md:ml-4">
			<button
				type="button"
				on:click={openCreatePatientModal}
				disabled={!selectedHospitalId || !selectedBangsalId}
				class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Tambah Pasien
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<LoadingSpinner size="lg" />
			<span class="ml-2 text-gray-600">Memuat data...</span>
		</div>
	{:else if hospitals.length === 0}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada rumah sakit</h3>
			<p class="mt-1 text-sm text-gray-500">
				Mulai dengan menambahkan rumah sakit dan bangsal untuk mengelola pasien.
			</p>
			<div class="mt-6 space-x-3">
				<a
					href="/hospitals"
					class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Kelola Rumah Sakit
				</a>
				<a
					href="/bangsal"
					class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Kelola Bangsal
				</a>
			</div>
		</div>
	{:else}
		<!-- Filters -->
		<div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Hospital Filter -->
				<div>
					<label for="hospital-filter" class="block text-sm font-medium text-gray-700 mb-2">
						Rumah Sakit
					</label>
					<select
						id="hospital-filter"
						bind:value={selectedHospitalId}
						on:change={handleHospitalChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					>
						<option value="">Semua rumah sakit</option>
						{#each hospitals as hospital}
							<option value={hospital.id}>{hospital.name}</option>
						{/each}
					</select>
				</div>

				<!-- Bangsal Filter -->
				<div>
					<label for="bangsal-filter" class="block text-sm font-medium text-gray-700 mb-2">
						Bangsal
					</label>
					<select
						id="bangsal-filter"
						bind:value={selectedBangsalId}
						on:change={handleBangsalChange}
						disabled={!selectedHospitalId}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option value="">Semua bangsal</option>
						{#each filteredBangsalList as bangsal}
							<option value={bangsal.id}>{bangsal.name}</option>
						{/each}
					</select>
				</div>

				<!-- Search -->
				<div>
					<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
						Cari Pasien
					</label>
					<input
						id="search"
						type="text"
						bind:value={searchTerm}
						on:input={handleSearchInput}
						placeholder="Nama pasien..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
			</div>
		</div>

		<!-- Patient Count -->
		{#if selectedHospitalId || selectedBangsalId || searchTerm.trim()}
			<div class="mb-4 flex items-center justify-between">
				<div class="text-sm text-gray-600">
					{#if patientsLoading}
						Mencari pasien...
					{:else}
						{patients.length} pasien ditemukan
						{#if searchTerm.trim()}
							untuk "{searchTerm}"
						{/if}
						{#if selectedHospital}
							di {selectedHospital.name}
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Patients List -->
		{#if patientsLoading}
			<div class="flex justify-center items-center py-12">
				<LoadingSpinner size="lg" />
				<span class="ml-2 text-gray-600">Memuat pasien...</span>
			</div>
		{:else if patients.length === 0}
			{#if selectedHospitalId || selectedBangsalId || searchTerm.trim()}
				<div class="text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada pasien</h3>
					<p class="mt-1 text-sm text-gray-500">
						{#if searchTerm.trim()}
							Tidak ditemukan pasien dengan nama "{searchTerm}".
						{:else}
							Belum ada pasien di filter yang dipilih.
						{/if}
					</p>
					{#if selectedHospitalId && selectedBangsalId}
						<div class="mt-6">
							<button
								type="button"
								on:click={openCreatePatientModal}
								class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Tambah Pasien Baru
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">Pilih filter untuk melihat pasien</h3>
					<p class="mt-1 text-sm text-gray-500">
						Gunakan filter rumah sakit, bangsal, atau pencarian nama untuk melihat daftar pasien.
					</p>
				</div>
			{/if}
		{:else}
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<ul class="divide-y divide-gray-200">
					{#each patients as patient (patient.id)}
						<li>
							<a href="/patients/{patient.id}" class="block hover:bg-gray-50 transition-colors">
								<div class="px-4 py-4 flex items-center justify-between">
									<div class="flex items-center">
										<div class="flex-shrink-0">
											<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
												<span class="text-blue-600 font-medium text-lg">
													{patient.full_name.charAt(0).toUpperCase()}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{patient.full_name}</div>
											<div class="text-sm text-gray-500 space-y-1">
												<div class="flex items-center space-x-4">
													<span>{patient.hospital?.name}</span>
													<span>•</span>
													<span>{patient.bangsal?.name}</span>
													{#if patient.room_number}
														<span>•</span>
														<span>Ruang {patient.room_number}</span>
													{/if}
												</div>
												{#if patient.mrn}
													<div>MRN: {patient.mrn}</div>
												{/if}
												<div class="text-xs text-gray-400">
													Ditambahkan {formatDate(patient.created_at)}
												</div>
											</div>
										</div>
									</div>
									<div class="flex items-center">
										<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</div>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>

<!-- Create Patient Modal -->
<Modal
	isOpen={showPatientModal}
	title="Tambah Pasien Baru"
	onClose={closePatientModal}
>
	<form on:submit|preventDefault={handleCreatePatient}>
		<div class="space-y-4">
			<div>
				<label for="patient-name" class="block text-sm font-medium text-gray-700 mb-2">
					Nama Lengkap *
				</label>
				<input
					id="patient-name"
					type="text"
					bind:value={newPatient.full_name}
					placeholder="Masukkan nama lengkap pasien"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					disabled={submitting}
					required
				/>
			</div>

			<div>
				<label for="patient-mrn" class="block text-sm font-medium text-gray-700 mb-2">
					Medical Record Number (MRN)
				</label>
				<input
					id="patient-mrn"
					type="text"
					bind:value={newPatient.mrn}
					placeholder="Opsional"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					disabled={submitting}
				/>
			</div>

			<div>
				<label for="patient-room" class="block text-sm font-medium text-gray-700 mb-2">
					Nomor Ruangan
				</label>
				<input
					id="patient-room"
					type="text"
					bind:value={newPatient.room_number}
					placeholder="Opsional"
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					disabled={submitting}
				/>
			</div>

			<div>
				<label for="patient-hospital" class="block text-sm font-medium text-gray-700 mb-2">
					Rumah Sakit *
				</label>
				<select
					id="patient-hospital"
					bind:value={newPatient.hospital_id}
					on:change={() => { newPatient.bangsal_id = ''; }}
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					disabled={submitting}
					required
				>
					<option value="">Pilih rumah sakit...</option>
					{#each hospitals as hospital}
						<option value={hospital.id}>{hospital.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="patient-bangsal" class="block text-sm font-medium text-gray-700 mb-2">
					Bangsal *
				</label>
				<select
					id="patient-bangsal"
					bind:value={newPatient.bangsal_id}
					disabled={!newPatient.hospital_id || submitting}
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					required
				>
					<option value="">Pilih bangsal...</option>
					{#each bangsalList.filter((b) => b.hospital_id === newPatient.hospital_id) as bangsal}
						<option value={bangsal.id}>{bangsal.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex justify-end space-x-3 mt-6">
			<button
				type="button"
				on:click={closePatientModal}
				disabled={submitting}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				Batal
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
				{#if submitting}
					<LoadingSpinner size="sm" color="white" />
					<span class="ml-2">Menyimpan...</span>
				{:else}
					Simpan
				{/if}
			</button>
		</div>
	</form>
</Modal>
