import { c as create_ssr_component, v as validate_component, b as add_attribute, d as escape } from "../../../chunks/ssr.js";
import "../../../chunks/toast.js";
import { L as LoadingSpinner, M as Modal } from "../../../chunks/LoadingSpinner.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let showModal = false;
  let editingHospital = null;
  let hospitalName = "";
  let showDeleteModal = false;
  let hospitalToDelete = null;
  function closeModal() {
    showModal = false;
    editingHospital = null;
    hospitalName = "";
  }
  function closeDeleteModal() {
    showDeleteModal = false;
    hospitalToDelete = null;
  }
  return `${$$result.head += `<!-- HEAD_svelte-vbtjam_START -->${$$result.title = `<title>Rumah Sakit - SOAP Manager</title>`, ""}<!-- HEAD_svelte-vbtjam_END -->`, ""} <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"><div class="md:flex md:items-center md:justify-between mb-6"><div class="flex-1 min-w-0" data-svelte-h="svelte-5xzf8c"><h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Rumah Sakit</h2> <p class="mt-1 text-sm text-gray-500">Kelola rumah sakit tempat Anda bertugas</p></div> <div class="mt-4 flex md:mt-0 md:ml-4"><button type="button" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" data-svelte-h="svelte-1qj62fx"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
				Tambah Rumah Sakit</button></div></div> ${`<div class="flex justify-center items-center py-12">${validate_component(LoadingSpinner, "LoadingSpinner").$$render($$result, { size: "lg" }, {}, {})} <span class="ml-2 text-gray-600" data-svelte-h="svelte-18l6m4c">Memuat data...</span></div>`}</div>  ${validate_component(Modal, "Modal").$$render(
    $$result,
    {
      isOpen: showModal,
      title: editingHospital ? "Edit Rumah Sakit" : "Tambah Rumah Sakit",
      onClose: closeModal
    },
    {},
    {
      default: () => {
        return `<form><div class="mb-4"><label for="hospital-name" class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-1plambn">Nama Rumah Sakit</label> <input id="hospital-name" type="text" placeholder="Masukkan nama rumah sakit" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" ${""} required${add_attribute("value", hospitalName, 0)}></div> <div class="flex justify-end space-x-3"><button type="button" ${""} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">Batal</button> <button type="submit" ${""} class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">${`${escape(editingHospital ? "Perbarui" : "Simpan")}`}</button></div></form>`;
      }
    }
  )}  ${validate_component(Modal, "Modal").$$render(
    $$result,
    {
      isOpen: showDeleteModal,
      title: "Hapus Rumah Sakit",
      onClose: closeDeleteModal
    },
    {},
    {
      default: () => {
        return `${hospitalToDelete ? `<p class="text-sm text-gray-500 mb-4">Apakah Anda yakin ingin menghapus rumah sakit <strong>${escape(hospitalToDelete.name)}</strong>?
			Tindakan ini akan menghapus semua bangsal dan pasien yang terkait.</p> <div class="flex justify-end space-x-3"><button type="button" ${""} class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">Batal</button> <button type="button" ${""} class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">${`Hapus`}</button></div>` : ``}`;
      }
    }
  )}`;
});
export {
  Page as default
};
