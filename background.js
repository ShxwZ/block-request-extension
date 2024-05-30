
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

async function updateRules(blockedUrls) {
  if (!blockedUrls) {
    console.error('blockedUrls is undefined');
    return;
  }
  console.log('AQUI:', blockedUrls);
  const rules = blockedUrls.filter(bu => bu.active).map((bu, index) => ({
    id: index + 1,
    priority: 1,
    action: bu.data ? {
      type: "redirect",
      redirect: {
        url: bu.isUrl ? bu.data : `data:application/json;base64,${btoa(bu.data)}`
      }
    } : {
      type: "block"
    },
    condition: {
      urlFilter: bu.url
    }
  }));
  await getExistingRules().then(actualRules => {

    const idToRemove = actualRules.filter(rule => !rules.includes(r => r.id === rule.id)).map(rule => rule.id)
    console.log("Removing rules:", idToRemove);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idToRemove, 
      addRules: rules
    }, () => {
      if (chrome.runtime.lastError) {
        console.log(rules)
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


async function getBlockedUrls() {
  const result = await chrome.storage.local.get('blockedUrls');
    const urls = result.blockedUrls ? result.blockedUrls.filter(bu => bu.url !== undefined) : [];
    return urls;
}
