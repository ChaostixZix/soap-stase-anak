<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import NLCommandBox from '$lib/components/NLCommandBox.svelte';
  import PlanViewer from '$lib/components/PlanViewer.svelte';
  import type { Patient, Soap, PlanItem } from '$lib/db.js';
  
  export let data: { patient: Patient | null; soap: Soap | null };

  const patientId = $page.params.id;
  let patient: Patient | null = data?.patient || null;
  let soap: Soap | null = data?.soap || null;
  let loading = !patient;
  let error = '';
  
  // Editing states
  let editingS = false;
  let editingO = false; 
  let editingA = false;
  let sValue = soap?.s || '';
  let oValue = soap?.o || '';
  let aValue = soap?.a || '';
  
  // Saving states
  let savingS = false;
  let savingO = false;
  let savingA = false;
  
  // Plan items
  $: planItems = soap?.p || [];

  async function loadPatientAndSoap() {
    loading = true;
    error = '';
    
    try {
      // Load patient if not already loaded
      if (!patient) {
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        const patientResult = await patientResponse.json();
        
        if (patientResponse.ok && patientResult.ok) {
          patient = patientResult.data;
        } else {
          error = patientResult.error || 'Failed to load patient';
          return;
        }
      }

      // Load latest SOAP
      const soapResponse = await fetch(`/api/patients/${patientId}/soap/latest`);
      const soapResult = await soapResponse.json();
      
      if (soapResponse.ok && soapResult.ok) {
        soap = soapResult.data;
        // Update form values
        sValue = soap?.s || '';
        oValue = soap?.o || '';
        aValue = soap?.a || '';
      } else {
        error = soapResult.error || 'Failed to load SOAP';
      }
    } catch (e) {
      error = 'Failed to load data';
      console.error('Error loading data:', e);
    } finally {
      loading = false;
    }
  }

  async function saveSoapField(field: 's' | 'o' | 'a', value: string) {
    if (!soap) return;
    
    
    if (field === 's') savingS = true;
    else if (field === 'o') savingO = true;
    else if (field === 'a') savingA = true;
    
    try {
      const response = await fetch(`/api/soap/${soap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      const result = await response.json();
      
      if (response.ok && result.ok) {
        soap = result.data;
        showToast('Saved successfully', 'success');
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (e) {
      console.error('Error saving field:', e);
      showToast('Failed to save changes', 'error');
    } finally {
      if (field === 's') savingS = false;
      else if (field === 'o') savingO = false;
      else if (field === 'a') savingA = false;
    }
  }

  function startEditing(field: 's' | 'o' | 'a') {
    if (field === 's') editingS = true;
    else if (field === 'o') editingO = true;
    else if (field === 'a') editingA = true;
  }

  async function saveField(field: 's' | 'o' | 'a') {
    const value = field === 's' ? sValue : field === 'o' ? oValue : aValue;
    await saveSoapField(field, value);
    
    if (field === 's') editingS = false;
    else if (field === 'o') editingO = false;
    else if (field === 'a') editingA = false;
  }

  function cancelEdit(field: 's' | 'o' | 'a') {
    if (field === 's') {
      sValue = soap?.s || '';
      editingS = false;
    } else if (field === 'o') {
      oValue = soap?.o || '';
      editingO = false;
    } else if (field === 'a') {
      aValue = soap?.a || '';
      editingA = false;
    }
  }

  function handleNLResult(event: CustomEvent<{ result: string }>) {
    const result = event.detail.result;
    
    // Reload SOAP data if the command might have changed it
    if (result.includes('tambah') || result.includes('obat') || result.includes('Plan Aktif')) {
      loadPatientAndSoap();
    }
  }

  // Simple toast system
  let toasts: Array<{id: number, message: string, type: 'success' | 'error'}> = [];
  let toastId = 0;

  function showToast(message: string, type: 'success' | 'error') {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  onMount(() => {
    if (!patient || !soap) {
      loadPatientAndSoap();
    }
  });
</script>

<svelte:head>
  <title>{patient ? `${patient.full_name} - SOAP` : 'Loading SOAP'} | SOAP Manager</title>
</svelte:head>

<!-- Toast notifications -->
{#each toasts as toast (toast.id)}
  <div class="fixed top-4 right-4 z-50 bg-{toast.type === 'success' ? 'green' : 'red'}-100 border border-{toast.type === 'success' ? 'green' : 'red'}-200 text-{toast.type === 'success' ? 'green' : 'red'}-800 px-4 py-2 rounded-md shadow-lg">
    {toast.message}
  </div>
{/each}

<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600">Loading SOAP data...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-400 text-xl">❌</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
          <button 
            class="mt-2 text-sm text-red-800 underline hover:text-red-900"
            on:click={loadPatientAndSoap}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  {:else if patient}
    <!-- Patient Header -->
    <div class="bg-white shadow-sm rounded-lg mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
            <div class="mt-1 flex items-center space-x-4 text-sm text-gray-600">
              <span>MRN: {patient.mrn || 'N/A'}</span>
              <span>Room: {patient.room_number || 'N/A'}</span>
              <span>{patient.hospital?.name} - {patient.bangsal?.name}</span>
            </div>
          </div>
          <a 
            href="/patients/{patient.id}"
            class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Back to Profile
          </a>
        </div>
      </div>
    </div>

    <!-- Natural Language Command Box -->
    <div class="mb-6">
      <NLCommandBox 
        patientId={patientId}
        on:result={handleNLResult}
      />
    </div>

    {#if soap}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- SOAP Fields -->
        <div class="space-y-6">
          <!-- Subjective -->
          <div class="bg-white shadow-sm rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900">Subjective (S)</h2>
              {#if !editingS}
                <button
                  type="button"
                  class="text-sm text-indigo-600 hover:text-indigo-800"
                  on:click={() => startEditing('s')}
                >
                  Edit
                </button>
              {/if}
            </div>
            <div class="px-6 py-4">
              {#if editingS}
                <div class="space-y-3">
                  <textarea
                    bind:value={sValue}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows="6"
                    placeholder="Enter subjective findings..."
                  ></textarea>
                  <div class="flex justify-end space-x-2">
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      on:click={() => cancelEdit('s')}
                      disabled={savingS}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      on:click={() => saveField('s')}
                      disabled={savingS}
                    >
                      {#if savingS}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      {/if}
                      Save
                    </button>
                  </div>
                </div>
              {:else}
                <div class="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] p-3 bg-gray-50 rounded border">
                  {soap.s || 'No subjective findings recorded'}
                </div>
              {/if}
            </div>
          </div>

          <!-- Objective -->
          <div class="bg-white shadow-sm rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900">Objective (O)</h2>
              {#if !editingO}
                <button
                  type="button"
                  class="text-sm text-indigo-600 hover:text-indigo-800"
                  on:click={() => startEditing('o')}
                >
                  Edit
                </button>
              {/if}
            </div>
            <div class="px-6 py-4">
              {#if editingO}
                <div class="space-y-3">
                  <textarea
                    bind:value={oValue}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows="6"
                    placeholder="Enter objective findings..."
                  ></textarea>
                  <div class="flex justify-end space-x-2">
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      on:click={() => cancelEdit('o')}
                      disabled={savingO}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      on:click={() => saveField('o')}
                      disabled={savingO}
                    >
                      {#if savingO}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      {/if}
                      Save
                    </button>
                  </div>
                </div>
              {:else}
                <div class="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] p-3 bg-gray-50 rounded border">
                  {soap.o || 'No objective findings recorded'}
                </div>
              {/if}
            </div>
          </div>

          <!-- Assessment -->
          <div class="bg-white shadow-sm rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900">Assessment (A)</h2>
              {#if !editingA}
                <button
                  type="button"
                  class="text-sm text-indigo-600 hover:text-indigo-800"
                  on:click={() => startEditing('a')}
                >
                  Edit
                </button>
              {/if}
            </div>
            <div class="px-6 py-4">
              {#if editingA}
                <div class="space-y-3">
                  <textarea
                    bind:value={aValue}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows="6"
                    placeholder="Enter assessment/diagnosis..."
                  ></textarea>
                  <div class="flex justify-end space-x-2">
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      on:click={() => cancelEdit('a')}
                      disabled={savingA}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="px-3 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      on:click={() => saveField('a')}
                      disabled={savingA}
                    >
                      {#if savingA}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      {/if}
                      Save
                    </button>
                  </div>
                </div>
              {:else}
                <div class="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px] p-3 bg-gray-50 rounded border">
                  {soap.a || 'No assessment recorded'}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Plan Viewer -->
        <PlanViewer planItems={planItems} />
      </div>
    {:else}
      <!-- No SOAP Entry -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <span class="text-yellow-400 text-4xl mb-4 block">📋</span>
        <h3 class="text-lg font-medium text-yellow-800 mb-2">No SOAP Entry Found</h3>
        <p class="text-sm text-yellow-700 mb-4">
          This patient doesn't have any SOAP entries yet. 
        </p>
        <button 
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
          disabled
        >
          Create New SOAP Entry (Coming Soon)
        </button>
      </div>
    {/if}
  {/if}
</div>