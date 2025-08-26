<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    command: { command: string };
    result: { result: string };
  }>();

  export let patientId: string | undefined = undefined;
  export let placeholder = "e.g., 'Apa diagnosis pasien ini?' atau 'Tambahkan obat Cefotaxime 1g IV untuk 3 hari'";
  export let disabled = false;

  let command = '';
  let loading = false;
  let result = '';

  async function handleSubmit() {
    if (!command.trim() || loading) return;
    
    loading = true;
    result = '';
    
    try {
      dispatch('command', { command: command.trim() });
      
      const response = await fetch('/api/nl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: command.trim(),
          patient_id: patientId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        result = data.data.response || 'Command processed successfully';
        dispatch('result', { result });
        command = '';
      } else {
        result = data.error || 'Command failed';
      }
    } catch (e) {
      console.error('Error processing NL command:', e);
      result = 'Failed to process command';
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function clearResult() {
    result = '';
  }
</script>

<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 class="text-sm font-medium text-blue-800 mb-3">
    🤖 Natural Language Commands
  </h3>
  
  <div class="space-y-3">
    <!-- Input area -->
    <div class="flex space-x-2">
      <input
        type="text"
        bind:value={command}
        {placeholder}
        class="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        on:keydown={handleKeydown}
        disabled={loading || disabled}
      />
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={handleSubmit}
        disabled={loading || !command.trim() || disabled}
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        {/if}
        Send
      </button>
    </div>

    <!-- Example commands -->
    <div class="text-xs text-blue-600">
      <strong>Examples:</strong>
      <button 
        class="ml-2 underline hover:no-underline" 
        on:click={() => command = "Apa diagnosis pasien ini?"}
        disabled={loading}
      >
        Get diagnosis
      </button>
      •
      <button 
        class="ml-1 underline hover:no-underline" 
        on:click={() => command = "Tambahkan obat Cefotaxime 1g IV untuk 3 hari"}
        disabled={loading}
      >
        Add medication
      </button>
    </div>

    <!-- Result area -->
    {#if result}
      <div class="relative bg-white border border-blue-200 rounded p-3">
        <button
          type="button"
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          on:click={clearResult}
          title="Clear result"
        >
          ✕
        </button>
        <div class="pr-8">
          <div class="text-xs font-medium text-blue-800 mb-1">Response:</div>
          <pre class="whitespace-pre-wrap text-xs text-gray-700 font-mono">{result}</pre>
        </div>
      </div>
    {/if}

    <!-- Loading state -->
    {#if loading}
      <div class="flex items-center justify-center py-2">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
        <span class="text-sm text-blue-700">Processing command...</span>
      </div>
    {/if}
  </div>
</div>