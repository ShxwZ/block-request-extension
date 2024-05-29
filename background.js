// Este oyente recibe mensajes del popup y actualiza las reglas en consecuencia
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateRules') {
    const blockedUrls = message.rules.blockedUrls;
    console.log('Updating rules:', blockedUrls)
    updateRules(blockedUrls);
    sendResponse({ success: true });
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
async function updateRules(blockedUrls) {
  if (!blockedUrls) {
    console.error('blockedUrls is undefined');
    return;
  }
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
  await getExistingRules().then(actualRules => {

    const idToRemove = actualRules.filter(rule => !rules.includes(r => r.id === rule.id)).map(rule => rule.id)
    console.log("Removing rules:", idToRemove);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idToRemove, // Elimina todas las reglas existentes
      addRules: rules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error updating rules:", chrome.runtime.lastError.message);
      } else {
        console.log("Rules updated successfully.");
      }
    });


  });

  
}

chrome.runtime.onInstalled.addListener(async () => {
  const blockedUrls = await getBlockedUrls();
  await updateRules(blockedUrls);
});

// Esta función obtiene las URLs bloqueadas del almacenamiento local
async function getBlockedUrls() {
  const result = await chrome.storage.local.get('blockedUrls');
  return result.blockedUrls || [];
}
