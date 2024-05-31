document.addEventListener('DOMContentLoaded', async () => {
  const addUrlForm = document.getElementById('addUrlForm');
  const urlInput = document.getElementById('urlInput');
  const urlData = document.getElementById('urlData');
  const isActiveData = document.getElementById('isActiveData');
  const isUrlCheck = document.getElementById('isUrlCheck');
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

  urlData.addEventListener('input', async (e) => {
    urlData.value === '' || !urlData.value ? addMockedDataButton.setAttribute('disabled', true) : addMockedDataButton.removeAttribute('disabled');

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

  isUrlCheck.addEventListener('change', async (e) => {
    manageisUrlCheck();
  
  });

  function manageisUrlCheck(){
    if(isUrlCheck.checked){
      isUrlCheck.removeAttribute('checked');
      mockFileData.style.display = 'none';
      mockDataArea.style.display = 'none';
      urlToRedirect.style.display = 'block';
    } else {
      isUrlCheck.setAttribute('checked', true);
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
    if(isUrlCheck.checked){
      finalData = dataUrl;
      
    }else{
      if(dataFile){
        finalData = dataFile;
      }
    }

    let blockedUrls = await getBlockedUrls();
    const index = dataDialog.getAttribute('data-index');

    blockedUrls[index] = { 
      url: urlData.value, 
      data: finalData, 
      active: isActiveData.checked, 
      isUrl: isUrlCheck.checked
    };

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
    blockedUrls.forEach((bu, index) => {
        const li = createListItem(bu, index);
        blockedUrlsList.appendChild(li);
    });
}

function createListItem(bu, index) {
    const li = document.createElement('li');
    li.classList.add('blocked-url');

    const linkContainer = createLinkContainer(bu);
    const actions = createActions(bu, index);

    li.appendChild(linkContainer);
    li.appendChild(actions);

    return li;
}

function createLinkContainer(bu) {
    const link = createLink(bu);
    const statusIcon = createStatusIcon(bu);
    const dataIcon = createDataIcon(bu);

    const linkContainer = document.createElement('div');
    linkContainer.classList.add('link-container');
    linkContainer.appendChild(statusIcon);
    linkContainer.appendChild(dataIcon);
    linkContainer.appendChild(link);

    return linkContainer;
}

function createLink(bu) {
    const link = document.createElement('a');
    link.href = bu.url.includes('http') ? bu.url : `http://${bu.url}`;
    link.target = "_blank";
    link.classList.add('url-link');
    link.textContent = bu.url;

    return link;
}

function createStatusIcon(bu) {
    const statusIcon = document.createElement('i');
    statusIcon.classList.add('fas', 'fa-lightbulb', 'status-icon');

    if(bu.active){
        statusIcon.classList.add('active');
    }

    return statusIcon;
}

function createDataIcon(bu) {
    const dataIcon = document.createElement('i');
    dataIcon.classList.add('fas', 'fa-file-alt', 'data-icon');

    if(bu.data) {
        dataIcon.classList.add('visible');
    }

    return dataIcon;
}

function createActions(bu, index) {
    const modifyButton = createModifyButton(bu, index);
    const trashButton = createTrashButton(index);

    const actions = document.createElement('div');
    actions.classList.add('actions-buttons');
    actions.appendChild(modifyButton);
    actions.appendChild(trashButton);

    return actions;
}

function createModifyButton(bu, index) {
    const modifyButton = document.createElement('div');
    modifyButton.setAttribute('data-tooltip', 'Modify');
    modifyButton.setAttribute('data-placement', 'left');
    modifyButton.classList.add('button');

    const modifyIcon = document.createElement('i');
    modifyIcon.classList.add('fas', 'fa-edit', 'modify-icon');

    modifyButton.addEventListener('click', async () => {
        await openDataDialog(bu, index);
    });

    modifyButton.appendChild(modifyIcon);

    return modifyButton;
}

function createTrashButton(index) {
    const trashButton = document.createElement('div');
    trashButton.setAttribute('data-tooltip', 'Click to remove');
    trashButton.setAttribute('data-placement', 'left');
    trashButton.classList.add('button');

    const trashIcon = document.createElement('i');
    trashIcon.classList.add('fas', 'fa-trash-alt', 'remove-icon');

    trashButton.addEventListener('click', async () => {
        await removeUrlAndUpdateRules(index);
        await loadBlockedUrls();
    });

    trashButton.appendChild(trashIcon);

    return trashButton;
}

async function openDataDialog(bu, index) {
    dataDialog.setAttribute('data-index', index);
    urlData.value = bu.url;

    isActiveData.checked = bu.active ?? false;

    isUrlCheck.checked = bu.isUrl ;
    manageisUrlCheck();

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
