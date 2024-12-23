// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//     if (message.action === "open_popup") {
//       chrome.action.openPopup();
//       console.log("background.js pop-up ...............",message.data)
//     }
//   });

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'open_popup') {
      // alert(message.data);
      chrome.action.openPopup();
      
      // console.log("background.js...............",message.data);
    }
    if (message.action === "SEND_WARPCAST_TEXT") {
            // alert(message.data);
              console.log("background.js pop-up ...............",message.data)
    }
  //   if (message.action === "WALLET_CONNECTED") {

  //     console.log("for wallet address from content.js ")

  //   // Forward this message to the popup or other components
  //   // chrome.runtime.sendMessage({
  //   //   action: "PROVIDER_DATA",
  //   //   provider: message.provider,
  //   //   accountAddress: message.accountAddress,
  //   //   chainId: message.chainId,
  //   // });
  // }

    if (message.action === "SEND_TWITTER_USERNAME") {
      // alert(message.data);
        console.log("background.js pop-up getTwitterUsername ...............",message.user)
}

  });

  // Cleanup the event listener when the component is unmounted

 