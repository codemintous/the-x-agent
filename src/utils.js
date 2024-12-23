export const getWebPageContent = () => {
    return new Promise((resolve, reject) => {
      const message = {
        from: 'react',
        message: 'Get page text'
      };
  
      const queryInfo = {
        active: true,
        currentWindow: true
      };
  
      chrome.tabs && chrome.tabs.query(queryInfo, tabs => {
        const currentTabId = tabs[0].id;
        chrome.tabs.sendMessage(currentTabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    });
  };

export const sendMsg = (msg) => {
    const message = {
        from: 'react',
        message: msg
    };

    const queryInfo = {
      active: true,
      currentWindow: true
    };

    chrome.tabs && chrome.tabs.query(queryInfo, tabs => {
      const currentTabId = tabs[0].id;
      chrome.tabs.sendMessage(currentTabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(new Error(chrome.runtime.lastError.message));
        }
      });
    });
};


export const getColorClass = (color) => {
  switch (color) {
    case 'yellow':
      return 'bg-yellow-300';
    case 'green':
      return 'bg-green-500';
    case 'cyan':
      return 'bg-cyan-400';
    case 'gray':
      return 'bg-gray-400';
    case 'orange':
      return 'bg-orange-400';
    case 'pink':
      return 'bg-pink-400';
    case 'blue':
      return 'bg-blue-500';
    case 'purple':
      return 'bg-purple-500';
    case 'rose':
      return 'bg-rose-400';
    case 'teal':
      return 'bg-teal-500';
    default:
      return '';
  }
};


export const saveStateToStorage = (key, state) => {
  chrome.storage.local.set({ [key]: state });
};

export const loadStateFromStorage = (key, callback) => {
  chrome.storage.local.get([key], (result) => {
    callback(result[key]);
  });
};

export const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } else {
    window.alert('Text-to-Speech not supported in this browser.');
  }
};