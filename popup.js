document.addEventListener('DOMContentLoaded', async () => {
  const addUrlForm = document.getElementById('addUrlForm');
  const urlInput = document.getElementById('urlInput');
  const blockedUrlsList = document.getElementById('blockedUrlsList');

  await loadBlockedUrls();

  addUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) {
      let blockedUrls = await getBlockedUrls();
      blockedUrls.push(url);
      await chrome.storage.local.set({ blockedUrls });
      await updateRules(blockedUrls);
      urlInput.value = '';
      await loadBlockedUrls();
    }
  });

  async function loadBlockedUrls() {
    blockedUrlsList.innerHTML = '';
    const blockedUrls = await getBlockedUrls();
    blockedUrls.forEach((url, index) => {
      const li = document.createElement('li');
      li.classList.add('blocked-url');
      
      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.classList.add('url-link');
      link.textContent = url;
      const trashButton = document.createElement('div');
      trashButton.setAttribute('data-tooltip', 'Click to remove');
      trashButton.classList.add('remove-button');
      const trashIcon = document.createElement('i');
      trashIcon.classList.add('fas', 'fa-trash-alt', 'remove-icon');
      
                    

      trashButton.addEventListener('click', async () => {
        const url = blockedUrls[index];
        await removeUrlAndUpdateRules(url);
        await loadBlockedUrls();
      });
      
      
      trashButton.appendChild(trashIcon);
      li.appendChild(link);
      li.appendChild(trashButton);
      blockedUrlsList.appendChild(li);
    });
  }
  

  async function getBlockedUrls() {
    const result = await chrome.storage.local.get('blockedUrls');
    return result.blockedUrls || [];
  }

  async function removeUrlAndUpdateRules(url) {
    let blockedUrls = await getBlockedUrls();
    const index = blockedUrls.indexOf(url);
    if (index !== -1) {
      blockedUrls.splice(index, 1);
      await chrome.storage.local.set({ blockedUrls });
      await updateRules(blockedUrls); 
    }
  }


  async function updateRules(blockedUrls) {
    chrome.runtime.sendMessage({ type: 'updateRules', rules: {blockedUrls} }, response => {
      console.log('Rules updated:', response.success);
    });
  }
});
