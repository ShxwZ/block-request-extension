// Este oyente recibe mensajes del popup y actualiza las reglas en consecuencia
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateRules') {
    const blockedUrls = message.rules.blockedUrls;
    const idsToRemove = message.rules.idsToRemove;
    console.log(blockedUrls)
    updateRules(blockedUrls,idsToRemove); // Actualiza las reglas cuando se recibe un mensaje del popup
    sendResponse({ success: true }); // Envía una respuesta al popup si es necesario
  }
});
async function getExistingRules() {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.getDynamicRules(rules => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(rules);
      }
    });
  });
}
// Esta función actualiza las reglas de bloqueo en la API declarativeNetRequest
async function updateRules(blockedUrls,idsToRemove = []) {
  const rules = blockedUrls.map((url, index) => ({
    id: index + 1, // Empezamos desde 1 y seguimos incrementando
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: url
    }
  }));
  const actualRules = await getExistingRules();
  console.log("Id to remove",idsToRemove)
  console.log("actual rules", actualRules)
  const idToRemoveFinal = actualRules.filter(rule => !rules.includes(r => r.id === rule.id)).map(rule => rule.id)
  console.log("Id to remove final",idToRemoveFinal)
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: idToRemoveFinal , // Elimina todas las reglas existentes
    addRules: rules
  }, () => {
    console.log(rules)
    if (chrome.runtime.lastError) {
      console.error("Error updating rules:", chrome.runtime.lastError.message);
    } else {
      console.log("Rules updated successfully.");
    }
  });
}

// Este oyente se activa cuando se instala o actualiza la extensión
chrome.runtime.onInstalled.addListener(async () => {
  const blockedUrls = await getBlockedUrls();
  await updateRules(blockedUrls); // Actualiza las reglas cuando se instala o actualiza la extensión
});

// Esta función obtiene las URLs bloqueadas del almacenamiento local
async function getBlockedUrls() {
  const result = await chrome.storage.local.get('blockedUrls');
  return result.blockedUrls || [];
}
