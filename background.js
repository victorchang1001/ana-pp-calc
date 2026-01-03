const TARGET_HOST = "aswbe-d.ana.co.jp";

function updateActionForUrl(tabId, url) {
  if (!url || !tabId) return;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === TARGET_HOST) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  } catch (e) {
    chrome.action.disable(tabId);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Miles helper extension installed");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateActionForUrl(tabId, changeInfo.url || tab.url);
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (chrome.runtime.lastError || !tab) return;
    updateActionForUrl(tab.id, tab.url);
  });
});
