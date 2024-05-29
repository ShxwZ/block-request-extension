document.addEventListener('DOMContentLoaded', async () => {
  const addUrlForm = document.getElementById('addUrlForm');
  const urlInput = document.getElementById('urlInput');
  const blockedUrlsList = document.getElementById('blockedUrlsList');

  // Carga las URLs bloqueadas en el popup
  await loadBlockedUrls();

  // Maneja el formulario para agregar una nueva URL bloqueada
  addUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) {
      let blockedUrls = await getBlockedUrls();
      blockedUrls.push(url);
      await chrome.storage.local.set({ blockedUrls });
      await updateRules(blockedUrls); // Actualiza las reglas en el fondo
      urlInput.value = '';
      await loadBlockedUrls(); // Vuelve a cargar las URLs bloqueadas en el popup
    }
  });

  // Carga y muestra las URLs bloqueadas en el popup
  async function loadBlockedUrls() {
    blockedUrlsList.innerHTML = '';
    const blockedUrls = await getBlockedUrls();
    blockedUrls.forEach((url, index) => {
      const li = document.createElement('li');
      li.textContent = url;
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', async () => {
        const url = blockedUrls[index];
        await removeUrlAndUpdateRules(url); // Elimina la URL y actualiza las reglas
        await loadBlockedUrls(); // Vuelve a cargar las URLs bloqueadas en el popup
      });
      li.appendChild(removeButton);
      blockedUrlsList.appendChild(li);
    });
  }

  // Obtiene las URLs bloqueadas del almacenamiento local
  async function getBlockedUrls() {
    const result = await chrome.storage.local.get('blockedUrls');
    return result.blockedUrls || [];
  }

  // Esta función elimina una URL del almacenamiento local y actualiza las reglas en consecuencia
  async function removeUrlAndUpdateRules(url) {
    let blockedUrls = await getBlockedUrls();
    const idsToRemove = blockedUrls.indexOf(url) + 1;
    const index = blockedUrls.indexOf(url);
    if (index !== -1) {
      blockedUrls.splice(index, 1);
      await chrome.storage.local.set({ blockedUrls });
      await updateRules(blockedUrls,idsToRemove); // Actualiza las reglas en el fondo
    }
  }

  // Esta función envía un mensaje al fondo para actualizar las reglas
  async function updateRules(blockedUrls, idsToRemove = []) {
    chrome.runtime.sendMessage({ type: 'updateRules', rules: {blockedUrls,idsToRemove} }, response => {
      console.log(response); // Manejar la respuesta del fondo si es necesario
    });
  }
});
