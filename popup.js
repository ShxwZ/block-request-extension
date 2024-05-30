document.addEventListener('DOMContentLoaded', async () => {
  const addUrlForm = document.getElementById('addUrlForm');
  const urlInput = document.getElementById('urlInput');
  const urlData = document.getElementById('urlData');
  const isActiveData = document.getElementById('isActiveData');
  const fileOrUrlCheck = document.getElementById('fileOrUrlCheck');
  const urlToRedirect = document.getElementById('urlToRedirect');
  const mockDataArea = document.getElementById('mockDataArea');
  const mockFileData = document.getElementById('mockFileData');
  const closeDialog = document.getElementById('closeDialog');
  const addMockedDataButton = document.getElementById('addMockedData');
  const dataDialog = document.getElementById('dataDialog');
  const blockedUrlsList = document.getElementById('blockedUrlsList');


  closeDialog.addEventListener('click', async () => {
    dataDialog.setAttribute('open', false);
  });

  isActiveData.addEventListener('change', async (e) => {
    if(isActiveData.checked){
      isActiveData.setAttribute('checked', true);
    } else {
      isActiveData.removeAttribute('checked');
    }
  
  });

  mockFileData.addEventListener('change', function() {
    const file = this.files[0];
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        mockDataArea.value = event.target.result;
      };
      reader.readAsText(file);
    }
  });

  fileOrUrlCheck.addEventListener('change', async (e) => {
    manageFileOrUrlCheck();
  
  });

  function manageFileOrUrlCheck(){
    if(fileOrUrlCheck.checked){
      fileOrUrlCheck.removeAttribute('checked');
      mockFileData.style.display = 'none';
      mockDataArea.style.display = 'none';
      urlToRedirect.style.display = 'block';
    } else {
      fileOrUrlCheck.setAttribute('checked', true);
      urlToRedirect.style.display = 'none';
      mockDataArea.style.display = 'block';
      mockFileData.style.display = 'block';

    }
  }


  addMockedDataButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const dataFile = mockDataArea.value;
    const dataUrl = urlToRedirect.value;

    let finalData;
    if(fileOrUrlCheck.checked){
      finalData = dataUrl;
      
    }else{
      if(dataFile){
        finalData = dataFile;
      }
    }
    console.log('FINAL Data:', finalData);
    let blockedUrls = await getBlockedUrls();
    const index = dataDialog.getAttribute('data-index');

    blockedUrls[index] = { ...blockedUrls[index], data: finalData, active: isActiveData.checked, isUrl: fileOrUrlCheck.checked};

    await chrome.storage.local.set({ blockedUrls });
    await updateRules(blockedUrls);
    await loadBlockedUrls();
    dataDialog.setAttribute('open', false);
    
  });


  addUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) {
      let blockedUrls = await getBlockedUrls();
      blockedUrls.push({ url: url, data: undefined, active: true, isUrl: false});
      await chrome.storage.local.set({ blockedUrls });
      await updateRules(blockedUrls);
      urlInput.value = '';
      await loadBlockedUrls();
    }
  });

  await loadBlockedUrls();


  async function loadBlockedUrls() {
    blockedUrlsList.innerHTML = '';
    const blockedUrls = await getBlockedUrls();
    console.log('CARGANDO li Blocked urls:', blockedUrls);
    blockedUrls.forEach((bu, index) => {
      const li = document.createElement('li');
      li.classList.add('blocked-url');
      


      const link = document.createElement('a');
      link.href = bu.url;
      link.target = "_blank";
      link.classList.add('url-link');
      link.textContent = bu.url;

      const linkContainer = document.createElement('div');
      linkContainer.classList.add('link-container');

      const statusIcon = document.createElement('i');
      statusIcon.classList.add('fas', 'fa-lightbulb', 'status-icon');

      linkContainer.appendChild(statusIcon);

      if(bu.active){
        statusIcon.classList.add('active');
      }

      
      const dataIcon = document.createElement('i');
        
      dataIcon.classList.add('fas', 'fa-file-alt', 'data-icon');
      if(bu.data) {
        dataIcon.classList.add('visible');
      }
      linkContainer.appendChild(dataIcon)

      
      linkContainer.appendChild(link);


      const actions = document.createElement('div');
      actions.classList.add('actions-buttons');

      const modifyButton = document.createElement('div');
      modifyButton.setAttribute('data-tooltip', 'Modify');
      modifyButton.classList.add('button');
      
      const modifyIcon = document.createElement('i');
      modifyIcon.classList.add('fas', 'fa-edit', 'modify-icon');

      const trashButton = document.createElement('div');
      trashButton.setAttribute('data-tooltip', 'Click to remove');
      trashButton.classList.add('button');
      const trashIcon = document.createElement('i');
      trashIcon.classList.add('fas', 'fa-trash-alt', 'remove-icon');
      
                    

      modifyButton.addEventListener('click', async () => {
        dataDialog.setAttribute('data-index', index);
        urlData.textContent = bu.url;
        urlData.href = bu.url;

        isActiveData.checked = bu.active ?? false;


        fileOrUrlCheck.checked = bu.isUrl ;
        manageFileOrUrlCheck();

        if(bu.isUrl){
          urlToRedirect.value = bu.data ?? '';
          mockDataArea.value = '';
        } else{
          if(bu.data){

            mockDataArea.value = bu.data;
          } else {
            mockDataArea.value = '';
          }
          urlToRedirect.value = '';
        }

        

        dataDialog.setAttribute('open', true);
      });
      trashButton.addEventListener('click', async () => {
        await removeUrlAndUpdateRules(index);
        await loadBlockedUrls();
      });
      
      modifyButton.appendChild(modifyIcon);
      trashButton.appendChild(trashIcon);
      actions.appendChild(modifyButton);
      actions.appendChild(trashButton);
      li.appendChild(linkContainer);
      li.appendChild(actions);
      blockedUrlsList.appendChild(li);
    });
  }
  

  async function getBlockedUrls() {
    const result = await chrome.storage.local.get('blockedUrls');
    const urls = result.blockedUrls ? result.blockedUrls.filter(bu => bu.url !== undefined) : [];
    return urls;
  }

  async function removeUrlAndUpdateRules(index) {
    let blockedUrls = await getBlockedUrls() || [];
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
