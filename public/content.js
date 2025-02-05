const createMetaMaskProvider = require("metamask-extension-provider");
const Web3 = require("web3");

let provider = createMetaMaskProvider();
let chainIdCont = null;
let accountAddress = provider.selectedAddress;

provider.on("chainChanged", (chainId) => {
    console.log("chainChanged", chainId);
    chainIdCont = parseInt(chainId); // Update the chainId variable
});

provider.on("disconnect", (error) => {
    console.log("disconnect", error);
    chrome.runtime.sendMessage({ action: "WALLET_DISCONNECTED" });
});

provider.on("connect", (connectInfo) => {
    console.log("connect", connectInfo);
    // chrome.runtime.sendMessage({ action: "WALLET_CONNECTED", data: connectInfo });
});

provider.on("accountsChanged", (accounts) => {
    console.log("accountsChanged", accounts);
    chrome.runtime.sendMessage({
        action: 'WALLET_CONNECTED',
        data: accounts
    });

    if (accounts.length > 0) {
        accountAddress = accounts[0]; // Update the accountAddress variable
    } else {
        accountAddress = null; // No accounts connected
    }
});

async function connectWallet() {
    console.log("provider", provider);
    if (provider) {
        await provider.request({ method: "eth_requestAccounts" });
        const account = provider.selectedAddress;
        console.log(":connectWallet:", account);

        // chrome.runtime.sendMessage({
        //     action: 'WALLET_CONNECTED',
        //     data: account
        // });

        // chrome.runtime.sendMessage({
        //     action: "WALLET_CONNECTED",
        //     provider: provider,
        //     accountAddress: provider.selectedAddress,
        //     chainId: chainIdCont || "84532", // Use the updated chainId or default
        // });

        return account; // Return the wallet address
    } else {
        throw new Error("MetaMask provider not found.");
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CONNECT_WALLET") {
        connectWallet()
            .then((walletAddress) => {
                console.log("wallet connected...........", walletAddress);
                sendResponse({ status: "success", walletAddress });
            })
            .catch((error) => {
                sendResponse({ status: "error", message: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});


// const mintFunc = async () =>
//   {
//     try {
//       const data = {
//         userAddress: "0x20613aBe93e4611Cf547b4395E4248c6129c8697",
//         chainId: '0x14a34',
//         tokenName: `testing name`,
//         tokenSymbol: `testing`,
//         maxSupply: '10000000909090909090909000098098',
//         fundingGoal: '100000000000000000000',
//         amount: '500000000000000',
//       }

//       const response = await axios.post(
//         'https://magicmeme-backend.potp.xyz/memehub/getCreateCalldata',
//         data,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         }
//       )

//       console.log("response =========>>>>>>>>>",response.data)

//       const callData = response.data.data

//       const web3 = new Web3(provider)



//       const transactionData = {
//         data: callData.calldata,
//         to: callData.to,
//         from: callData.from,
//         value: callData.value,
//         gasLimit: 800000,
//       }

//       console.log('send transaction function ======>>>>>>>', transactionData)

//       const signedTx = await web3.eth.sendTransaction( transactionData )

//       console.log('Transaction successful, hash: ========>>>>>>>>', signedTx.transactionHash)

//       await addMemeDetails(signedTx.transactionHash)

//       return  signedTx

//     } catch (e) {
//       console.log('error =======>>>>>>>>', e)
//     }
// }


const mintFunc = async (memeName, symbol, amountInWei, desc, logoUrl) => {
    console.log("account address from ==============>", provider.selectedAddress);
    console.log("caling mint function properly ===========>>>>>>")
    try {
        const data = {
            // userAddress: `${provider.selectedAddress}`,
            userAddress: "0x6AEEb12fe14b7DAE54277e6bb0042466E2161bF8",
            chainId: '84532', //84532
            tokenName: `${memeName}`,
            tokenSymbol: `${symbol}`,
            maxSupply: '10000000909090909090909000098098',
            fundingGoal: '100000000000000000000',
            amount: `${amountInWei}`,
        };

        const response = await fetch('https://magicmeme-backend.potp.xyz/memehub/getCreateCalldata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        // Check if the response is OK (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("response =========>>>>>>>>>", responseData);

        const callData = responseData.data;
        const web3 = new Web3(provider);

        const transactionData = {
            data: callData.calldata,
            to: callData.to,
            from: callData.from,
            value: callData.value,
            gasLimit: 850000,
        };

        console.log('send transaction function ======>>>>>>>', transactionData);

        const signedTx = await web3.eth.sendTransaction(transactionData);
        console.log('Transaction successful, hash: ========>>>>>>>>', signedTx.transactionHash);

        // let tranhash = `0x7533b6eefc47d4c5b4a96e5b4070779afb8e7ec075b0562db901c36c106bf4cd`;
        await addMemeDetails(signedTx.transactionHash, memeName, symbol, desc, logoUrl);
        return signedTx;

    } catch (e) {
        console.log('error =======>>>>>>>>', e);

    }
};


const addMemeDetails = async (tranHash, memeName, symbol, desc, logoUrl) => {
    try {
        const response = await fetch('https://magicmeme-backend.potp.xyz/memehub/addDetails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userAddress: provider.selectedAddress,
                chainId: '84532',
                symbol: symbol,
                fullname: memeName,
                description: desc,
                logo: logoUrl,
                transactionHash: tranHash,
            }),
        });

        if (!response.ok) {
            // If the response status is not OK, handle the error
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // Parse JSON response
        console.log('Response from addMemeDetails function:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    if (request.action === "mint") {
        const { memeName, symbol, amount, desc, logoUrl } = request;  // Extract memeName and symbol from request object
        console.log("Message received:", memeName, symbol, amount, desc, logoUrl);
        const amountInWei = Web3.utils.toWei(amount, 'ether'); // Convert to wei

        mintFunc(memeName, symbol, amountInWei, desc, logoUrl)  // Pass memeName and symbol to mintFunc
            .then((result) => {
                console.log("Mint function result:", result);
                sendResponse({ status: 'success', data: result });
            })
            .catch((error) => {
                console.error("Mint function error:", error);
                sendResponse({ status: 'error', error: error.message });
            });

        return true; // Keep the message channel open for async response
    }
});





// To reset extension's state on new session
const initialColors = [
    "yellow",
    "green",
    "cyan",
    "gray",
    "orange",
    "pink",
    "blue",
    "purple",
    "rose",
    "teal",
];

chrome.storage.local.set({
    highlightedWords: [], availableColors: initialColors,
    chatInputValue: "", chatResponseValue: "", chatWasSubmitted: false,
    summaryInputValue: "", summaryResponseValue: "", summaryWasSubmitted: false
});

const messagesFromReactAppListener = (message, sender, response) => {

    console.log('[content.js]. Message received', {
        message,
        sender,
    })

    if (sender.id === chrome.runtime.id && message.from === "react" && message.message === 'Get page text') {
        const pageText = document.body.innerText;
        response(pageText);
    }


    if (sender.id === chrome.runtime.id && message.from === "react" && message.message.startsWith("highlight")) {
        let splits = message.message.split(" ");
        const searchTerm = splits[1];
        const className = "highColor" + splits[2].charAt(0).toUpperCase() + splits[2].slice(1);
        const searchTermRegex = new RegExp(searchTerm, 'gi'); // 'g' for global match and 'i' for case insensitive

        // Function to recursively traverse and highlight text nodes
        function highlightTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const matches = node.nodeValue.match(searchTermRegex);
                if (matches) {
                    const span = document.createElement('span');
                    span.innerHTML = node.nodeValue.replace(searchTermRegex, (match) => `<span class=${className}>${match}</span>`);
                    node.parentNode.replaceChild(span, node);
                }
            } else {
                for (let child of node.childNodes) {
                    highlightTextNodes(child);
                }
            }
        }

        highlightTextNodes(document.body);
        response("Done")
    }

    if (sender.id === chrome.runtime.id && message.from === "react" && message.message.startsWith("unhighlight")) {
        let splits = message.message.split(" ");
        const className = "highColor" + splits[1].charAt(0).toUpperCase() + splits[1].slice(1);
        const highlightedElements = document.querySelectorAll(`span.${className}`);

        highlightedElements.forEach(element => {
            const parent = element.parentNode;
            parent.replaceChild(document.createTextNode(element.innerText), element);
            parent.normalize(); // Merge adjacent text nodes
        });

        response("Done")
    }
}
chrome.runtime.onMessage.addListener(messagesFromReactAppListener);










let debounceTimer;
function debouncedDoSomething() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSomething, 3000);
    // debounceTimer = setTimeout(getWarpcastText, 3000);

}
function debouncedWarpcast() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(getWarpcastText, 1000);

}
function debouncedTwitter() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(getTwitterText, 1000);

}

function getEmojiForLabel(label) {
    const emojiMap = {
        // Topics
        "arts_culture": "🎨",
        "business_entrepreneurs": "💼",
        "celebrity_pop_culture": "🌟",
        "diaries_daily_life": "📔",
        "family": "👨‍👩‍👧‍👦",
        "fashion_style": "👗",
        "film_tv_video": "🎬",
        "fitness_health": "💪",
        "food_dining": "🍽️",
        "gaming": "🎮",
        "learning_educational": "📚",
        "music": "🎵",
        "news_social_concern": "📰",
        "other_hobbies": "🎲",
        "relationships": "💞",
        "science_technology": "💻",
        "sports": "🏅",
        "travel_adventure": "✈️",
        "youth_student_life": "🎓",
        // Sentiment
        "positive": "😊",
        "neutral": "😐",
        "negative": "😠",
        // Emotion
        "anger": "😡",
        "anticipation": "🔮",
        "disgust": "🤢",
        "fear": "😨",
        "joy": "😂",
        "love": "❤️",
        "optimism": "👍",
        "pessimism": "👎",
        "sadness": "😢",
        "surprise": "😲",
        "trust": "🤝",
    };

    return emojiMap[label] || "❓"; // Default to question mark if label not found
}

const iconsAbove50 = {
    "llm_generated": "🤖",
    "spam": "🔺",
    "sexual": "🔞",
    "hate": "😡",
    "violence": "⚔️",
    "harassment": "🚷",
    "self_harm": "🆘",
    "sexual_minors": "🚸",
    "hate_threatening": "🚨",
    "violence_graphic": "💥"
};

const iconsBelow50 = {
    "llm_generated": "👾", // Different icon or the same, depending on your preference
    "spam": "▼",
    "sexual": "🙈",
    "hate": "😠",
    "violence": "🛡️",
    "harassment": "🛑",
    "self_harm": "🚑",
    "sexual_minors": "👶",
    "hate_threatening": "⚠️",
    "violence_graphic": "🔨"
};

// Function to get the appropriate icon based on score
function getIcon(category, score) {
    if (score > 0.5) {
        return iconsAbove50[category];
    } else {
        return iconsBelow50[category];
    }
}

function getWarpcastText() {
    try {

        let text = document.getElementsByClassName("flex flex-col whitespace-pre-wrap break-words text-lg leading-6 tracking-normal")[0].innerText

        chrome.runtime.sendMessage({
            action: 'SEND_WARPCAST_TEXT',
            data: text
        });

    } catch (error) {
        console.log("error in getwrapcat ======>>>>>", error)

    }


}

function getTwitterText() {
    const parts = window.location.href.split('/');
    if (parts.length === 6) {
        let text_twitter = document.getElementsByClassName("css-175oi2r r-1s2bzr4")[0]?.innerText;

        chrome.runtime.sendMessage({
            action: 'SEND_WARPCAST_TEXT',
            data: text_twitter
        });
        console.log(text_twitter);
    }
}

function openPopupTwitter() {
    chrome.runtime.sendMessage({ action: "open_popup" });
    debouncedTwitter();

}


function openPoup() {
    chrome.runtime.sendMessage({ action: "open_popup" });
    debouncedWarpcast();

}




function doSomething() {


    const parts = window.location.href.split('/');

    console.log(parts.length);
    console.log(parts);

    function waitForElement(selector, callback) {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            }
        }, 500); // Retry every 500ms until the element is found
    }

    if (parts.length === 6) {
        let text_twitter = document.getElementsByClassName("css-175oi2r r-1s2bzr4")[0]?.innerText;
        console.log('Twitter text:', text_twitter);

        let globalData1 = null;
        let loadingInterval = null;

        // Wait for the tweetTextarea_0 element to appear
        waitForElement('div[data-testid="tweetTextarea_0"]', (targetElement) => {
            if (!text_twitter) {
                console.log('Tweet text does not exist');
                const messageDiv = document.createElement('div');
                messageDiv.innerText = 'Tweet text does not exist';
                messageDiv.style.color = 'red';
                messageDiv.style.marginTop = '10px';
                messageDiv.style.fontSize = '14px';

                targetElement.insertAdjacentElement('afterend', messageDiv);
                return;
            }

            // Check if "uniqueResponse" div already exists
            if (!document.getElementById("uniqueResponse")) {
                const newDiv = document.createElement('div');
                newDiv.id = "uniqueResponse";

                // Create the button container
                const buttonContainer = document.createElement("div");
                buttonContainer.id = "customButtonsContainer";
                buttonContainer.style.marginTop = "10px";
                buttonContainer.style.display = "flex";
                buttonContainer.style.gap = "8px";
                buttonContainer.style.flexWrap = "wrap";

                // Define button details
                const buttons = [
                    { emoji: "👍", text: "Positive", className: "custom-tone-positive" },
                    { emoji: "👎", text: "Negative", className: "custom-tone-negative" },
                    { emoji: "🤝", text: "Supportive", className: "custom-tone-supportive" },
                    { emoji: "🎉", text: "Enthusiastic", className: "custom-tone-enthusiastic" },
                    { emoji: "👏", text: "Encouraging", className: "custom-tone-encouraging" },
                    { emoji: "🤗", text: "Empathetic", className: "custom-tone-empathetic" },
                    { emoji: "🎊", text: "Congratulatory", className: "custom-tone-congratulatory" },
                    { emoji: "🙌", text: "Appreciative", className: "custom-tone-appreciative" },
                    { emoji: "ℹ️", text: "Informative", className: "custom-tone-informative" },
                    { emoji: "🚀", text: "Motivational", className: "custom-tone-motivational" },
                    { emoji: "🌟", text: "Inspirational", className: "custom-tone-inspirational" },
                    { emoji: "🔥", text: "Viral", className: "custom-tone-viral" },
                    { emoji: "👔", text: "Professional", className: "custom-tone-professional" },
                    { emoji: "😊", text: "Friendly", className: "custom-tone-friendly" },
                    { emoji: "🧘‍♀️", text: "Calm", className: "custom-tone-calm" },
                    { emoji: "🙏", text: "Polite", className: "custom-tone-polite" },
                    { emoji: "😂", text: "Humorous", className: "custom-tone-humorous" },
                    { emoji: "💡", text: "Idea", className: "custom-tone-idea" },
                    { emoji: "❓", text: "Questioning", className: "custom-tone-questioning" },
                ];

                // Create buttons
                buttons.forEach(({ emoji, text, className }) => {
                    const button = document.createElement("button");
                    button.className = className;
                    button.innerHTML = `<span>${emoji}</span> <span>${text}</span>`;
                    button.style.padding = "6px 12px";
                    button.style.color = "#1d9bef";
                    button.style.border = "1px solid black";
                    button.style.borderRadius = "5px";
                    button.style.cursor = "pointer";
                    button.style.backgroundColor = "#FFFFFF";
                    button.style.fontSize = "14px";

                    button.onclick = () => {
                        const tweetContainer = document.querySelector('div[data-testid="tweetTextarea_0RichTextInputContainer"]');

                        if (tweetContainer) {
                            const placeholder = tweetContainer.querySelector('.public-DraftEditorPlaceholder-root');
                            if (placeholder) {
                                placeholder.style.display = 'none';
                            }

                            const brElement = tweetContainer.querySelector('br[data-text="true"]');

                            if (brElement) {
                                const message = text_twitter;
                                let index = 0;

                                const typeText = () => {
                                    const currentBr = tweetContainer.querySelector('br[data-text="true"]');

                                    if (currentBr) {
                                        const newSpan = document.createElement('span');
                                        newSpan.setAttribute('data-text', 'true');
                                        newSpan.setAttribute('contenteditable', 'true');
                                        currentBr.replaceWith(newSpan);
                                        newSpan.focus();
                                    }

                                    const spanElement = tweetContainer.querySelector('span[data-text="true"]');

                                    if (spanElement && index < message.length) {
                                        spanElement.innerText += message.charAt(index);
                                        index++;
                                    } else if (index >= message.length) {
                                        clearInterval(typeInterval);
                                        spanElement.focus();

                                        // Create and dispatch input event
                                        const inputEvent = new InputEvent('input', {
                                            bubbles: true,
                                            cancelable: true,
                                        });
                                        spanElement.dispatchEvent(inputEvent);

                                        // Create and dispatch change event
                                        const changeEvent = new Event('change', {
                                            bubbles: true,
                                            cancelable: true,
                                        });
                                        spanElement.dispatchEvent(changeEvent);

                                        // Create and dispatch custom Tweet events
                                        const composeTweetEvent = new Event('composeTweet', {
                                            bubbles: true,
                                            cancelable: true,
                                        });
                                        spanElement.dispatchEvent(composeTweetEvent);

                                        // Trigger the tweet button activation
                                        const tweetButton = document.querySelector('[data-testid="tweetButton"]');
                                        if (tweetButton) {
                                            tweetButton.removeAttribute('disabled');
                                            tweetButton.style.opacity = '1';
                                        }

                                        // Add focus/blur behavior
                                        spanElement.addEventListener('input', () => {
                                            if (spanElement.innerText.trim() === '') {
                                                placeholder.style.display = 'block';
                                            } else {
                                                placeholder.style.display = 'none';
                                            }
                                            // Dispatch events again on manual input
                                            spanElement.dispatchEvent(new InputEvent('input', { bubbles: true }));
                                            spanElement.dispatchEvent(new Event('change', { bubbles: true }));
                                        });

                                        spanElement.addEventListener('focus', () => {
                                            placeholder.classList.add('public-DraftEditorPlaceholder-root-hasFocus');
                                        });

                                        spanElement.addEventListener('blur', () => {
                                            placeholder.classList.remove('public-DraftEditorPlaceholder-root-hasFocus');
                                        });
                                    }
                                };

                                const typeInterval = setInterval(typeText, 100);
                            }
                        }
                    };

                    buttonContainer.appendChild(button);
                });

                // Append the button container to the newDiv
                newDiv.appendChild(buttonContainer);

                // Insert the new div below the target element
                targetElement.appendChild(newDiv);
            }
        });
    }




    if (window.location.hostname === "www.linkedin.com") {
        console.log("LinkedIn detected");

        const buttons = [
            { emoji: "👍", text: "Positive", className: "custom-tone-positive" },
            { emoji: "👎", text: "Negative", className: "custom-tone-negative" },
            { emoji: "🤝", text: "Supportive", className: "custom-tone-supportive" },
            { emoji: "🎉", text: "Enthusiastic", className: "custom-tone-enthusiastic" }
        ];

        function insertButtonsBelowCommentBox() {
            const commentBoxes = document.querySelectorAll(".comments-comment-texteditor");

            commentBoxes.forEach(commentBox => {
                if (!commentBox.nextElementSibling || !commentBox.nextElementSibling.classList.contains("custom-comment-box")) {
                    const customDiv = document.createElement('div');
                    customDiv.className = "custom-comment-box";
                    customDiv.style.marginTop = "10px";
                    customDiv.style.padding = "10px";
                    customDiv.style.backgroundColor = "#f3f3f3";
                    customDiv.style.borderRadius = "5px";
                    customDiv.style.fontSize = "14px";
                    customDiv.style.display = "flex";
                    customDiv.style.flexWrap = "wrap";
                    customDiv.style.gap = "5px";

                    buttons.forEach(({ emoji, text, className }) => {
                        const button = document.createElement("button");
                        button.className = `tone-button ${className}`;
                        button.textContent = `${emoji} ${text}`;
                        button.style.padding = "5px 10px";
                        button.style.border = "none";
                        button.style.borderRadius = "5px";
                        button.style.cursor = "pointer";
                        button.style.fontSize = "12px";
                        button.style.backgroundColor = "#ffffff";
                        button.style.boxShadow = "0px 1px 3px rgba(0, 0, 0, 0.2)";

                        button.addEventListener("click", function () {
                            const postContainer = commentBox.closest(".feed-shared-update-v2");
                            if (postContainer) {
                                const postTextElement = postContainer.querySelector(".update-components-text span.break-words");
                                if (postTextElement) {
                                    const postText = `${postTextElement.innerText}`;
                                    const textInput = `Hello, how are you?`;
                                    callLLMModel(textInput, commentBox);
                                } else {
                                    console.warn("Post text not found.");
                                }
                            }
                        });

                        customDiv.appendChild(button);
                    });

                    commentBox.parentNode.insertBefore(customDiv, commentBox.nextSibling);
                }
            });
        }

        const observer = new MutationObserver(() => {
            insertButtonsBelowCommentBox();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        insertButtonsBelowCommentBox();
    }

    function callLLMModel(textInput, commentBox) {
        const url = "http://localhost:3000/api/chat";

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: textInput })
        })
        .then(response => response.json())
        .then(responseData => {
            console.log("LLM Model Response:", responseData);
            if (responseData && responseData.text) {
                commentBox.focus();
                document.execCommand("insertText", false, responseData.text);
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.dispatchEvent(new Event('keydown', { bubbles: true }));
                commentBox.dispatchEvent(new Event('keyup', { bubbles: true }));
            }
        })
        .catch(error => {
            console.error("Error calling LLM model:", error);
        });
    }


    if (window.location.hostname === "www.reddit.com") {
        console.log("Reddit detected");

        function addButtonsBelowCommentLoader() {
            const commentComposer = document.querySelector('shreddit-async-loader[bundlename="comment_composer"]');

            if (commentComposer && !commentComposer.dataset.buttonsAdded) {
                // Create a new div for buttons
                let buttonContainer = document.createElement("div");
                buttonContainer.style.display = "flex";
                buttonContainer.style.marginTop = "5px";
                buttonContainer.style.gap = "10px"; // Space between buttons

                // Define buttons and their respective text
                const buttons = [
                    { emoji: "👍", text: "Positive", className: "custom-tone-positive", insertText: "hiiiiiii" },
                    { emoji: "👎", text: "Negative", className: "custom-tone-negative", insertText: "I disagree with this point, here's why..." },
                    { emoji: "🤝", text: "Supportive", className: "custom-tone-supportive", insertText: "I'm here for you! Stay strong! 💪" },
                    { emoji: "🎉", text: "Enthusiastic", className: "custom-tone-enthusiastic", insertText: "This is amazing! 🎉🔥" }
                ];

                // Create and append buttons
                buttons.forEach(({ emoji, text, className, insertText }) => {
                    let button = document.createElement("button");
                    button.innerHTML = `${emoji} ${text}`;
                    button.className = className;
                    button.style.padding = "5px 10px";
                    button.style.border = "1px solid #ccc";
                    button.style.borderRadius = "5px";
                    button.style.cursor = "pointer";
                    button.style.backgroundColor = "#f8f9fa";
                    button.style.fontSize = "14px";

                    // Optional: Add hover effect
                    button.onmouseover = () => (button.style.backgroundColor = "#e0e0e0");
                    button.onmouseout = () => (button.style.backgroundColor = "#f8f9fa");

                    // Add click event to insert text into Reddit's comment box
                    // Add click event to insert text into Reddit's comment box
                    button.addEventListener("click", () => {
                        const commentBox = document.querySelector('div[slot="rte"][contenteditable="true"]'); // Locate the comment box

                        if (commentBox) {
                            commentBox.focus(); // Focus on the comment box

                            let pTag = commentBox.querySelector("p");
                            pTag.setAttribute("dir", "ltr");

                            if (pTag) {
                                let brTag = pTag.querySelector("br");

                                // Retrieve the post text
                                const postText = document.querySelector('.text-neutral-content .md').innerText; // Adjust this selector based on the actual post's text element

                                // Print the post text in the console
                                console.log(postText);

                                // Set the insert text as the post's text
                                let insertText = postText; // You can further modify this if needed

                                if (brTag) {
                                    // Replace <br> with a span element
                                    let span = document.createElement("span");
                                    span.setAttribute("data-lexical-text", "true");
                                    span.textContent = insertText;
                                    pTag.innerHTML = ""; // Clear existing content
                                    pTag.appendChild(span); // Insert new text
                                } else {
                                    // If no <br>, just append text inside the existing p
                                    let span = document.createElement("span");
                                    span.setAttribute("data-lexical-text", "true");
                                    span.textContent = insertText;
                                    pTag.appendChild(span);
                                }
                            }
                        } else {
                            console.warn("Reddit comment box not found.");
                        }
                    });


                    buttonContainer.appendChild(button);
                });

                // Insert the button container below the comment loader
                commentComposer.after(buttonContainer);

                // Mark as processed to avoid duplication
                commentComposer.dataset.buttonsAdded = "true";

                console.log("Added buttons below comment composer loader.");
            }
        }

        // Observe the DOM for changes to detect the loader dynamically
        const observer = new MutationObserver(() => {
            addButtonsBelowCommentLoader();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        addButtonsBelowCommentLoader();
    }













    // if (parts.length === 4 && parts[2] == "x.com") {
    //     let username = parts[3];
    //     console.log("username from twitter ======", username);

    //     const div = document.querySelector('div[data-testid="UserName"]');

    //     // Create the new button element
    //     const button = document.createElement('button');
    //     button.textContent = 'Swap';

    //     // Add styles directly to the button
    //     button.style.backgroundColor = '#e7e8e9';  // light gray background
    //     button.style.border = 'none';
    //     button.style.borderRadius = '50px';        // rounded edges
    //     button.style.padding = '10px 20px';        // space inside the button
    //     button.style.color = 'black';              // text color
    //     button.style.fontSize = '16px';            // text size
    //     button.style.cursor = 'pointer';           // shows pointer on hover
    //     button.style.fontFamily = 'Arial, sans-serif'; // font style
    //     button.style.fontWeight = 'bold';          // bold text
    //     button.style.width = '90px';              // set button width
    //     button.style.marginBottom = '10px';            // set margin (10px top and bottom)

    //     // Add hover effect (using JavaScript)
    //     button.addEventListener('mouseenter', function () {
    //         button.style.backgroundColor = '#d6d7d8'; // darker gray on hover
    //     });
    //     button.addEventListener('mouseleave', function () {
    //         button.style.backgroundColor = '#e7e8e9'; // return to original color
    //     });

    //     // Insert the button after the div
    //     // div.insertAdjacentElement('afterend', button);
    //     div.appendChild(button);
    // }


    // if (parts.length === 6) {

    //     let text_twitter = document.getElementsByClassName("css-175oi2r r-1s2bzr4")[0]?.innerText;
    //     console.log('Twitter text:', text_twitter);

    //     let globalData1 = null;
    //     let loadingInterval = null;

    //     // Select the target element
    //     const targetElement = document.querySelector('.css-175oi2r.r-18u37iz.r-1udh08x.r-1c4vpko.r-1c7gwzm.r-1ny4l3l');

    //     // Check if the Twitter text exists
    //     if (!text_twitter) {
    //         console.log('Tweet text does not exist');
    //         const messageDiv = document.createElement('div');
    //         messageDiv.innerText = 'Tweet text does not exist';
    //         messageDiv.style.color = 'red';
    //         messageDiv.style.marginTop = '10px';
    //         messageDiv.style.fontSize = '14px';

    //         if (targetElement) {
    //             targetElement.insertAdjacentElement('afterend', messageDiv);
    //         }
    //         return;
    //     }

    //     const memecoinTokens = [
    //         "$DOGE", "$SHIB", "$PEPE", "$FLOKI", "$BabyDoge", "$LEASH",
    //         "$AKITA", "$KISHU", "$HOGE", "$DOBO", "$POPCAT"
    //     ];

    //     // Find the first memecoin token in the tweet text
    //     const foundToken = memecoinTokens.find(token => text_twitter.includes(token));

    //     if (!foundToken) {
    //         const messageDiv = document.createElement('div');
    //         messageDiv.innerText = 'No memecoin token exists in the tweet';
    //         messageDiv.style.color = 'red';
    //         messageDiv.style.marginTop = '10px';
    //         messageDiv.style.fontSize = '14px';

    //         if (targetElement) {
    //             targetElement.insertAdjacentElement('afterend', messageDiv);
    //         }
    //         return;
    //     }

    //     if (!document.getElementById("uniqueId0")) {
    //         const outerDivx = document.createElement('div');
    //         outerDivx.id = 'uniqueId0';
    //         outerDivx.className = 'ui-container';

    //         const innerDiv = document.createElement('div');
    //         innerDiv.id = 'firstIcon';
    //         innerDiv.style.paddingTop = "10px";

    //         // Abbreviate the token if it's long (e.g., "$DOGE")
    //         const abbreviatedToken = foundToken.length > 6
    //             ? `${foundToken.slice(0, 6)}...`
    //             : foundToken;

    //         const initialChar = foundToken.charAt(1); // Get the first character of the token (after $)

    //         innerDiv.innerHTML = `
    //     <div style="background-color: #000000; border:2px solid #2F3336; color: white; padding: 20px; margin: 10px; border-radius: 15px; display: flex; flex-direction: row; align-items: center; gap: 15px;">
    //         <!-- Rounded div -->
    //         <div style="flex-grow: 1;">
    //             <div  id="wbtcToken" style="display: flex; flex-direction: row; gap:6px; align-items: center; margin-bottom:4px;">
    //                 <div style="background-color: #FF9900; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
    //                     <span style="font-size: 14px; color: white; font-weight: bold;">${initialChar}</span>
    //                 </div>
    //                 <div style="font-size: 14px; color: #bbb; cursor: pointer;">
    //                     ${abbreviatedToken} <span style="color: #3b82f6;">${foundToken}</span>
    //                 </div>
    //             </div>
    //             <div style="font-size: 22px; font-weight: bold;">$305.2M MC <span style="font-size: 12px; color: #bbb; cursor: pointer;">&#x21bb;</span></div>
    //             <div style="font-size: 14px; color: #4caf50;">+5.44% today</div>
    //             <div style="font-size: 14px; color: #bbb;">$101.67K price</div>
    //         </div>
    //         <!-- Buy and Sell buttons -->
    //         <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
    //             <button style="background-color: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">Buy</button>
    //             <button style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">Sell</button>
    //         </div>
    //     </div>`;

    //         outerDivx.appendChild(innerDiv);

    //         // Insert outerDivx after the target element
    //         if (targetElement) {
    //             targetElement.insertAdjacentElement('afterend', outerDivx);
    //         }

    //         // Optional: Bind click event to the token display
    //         const wbtcToken = document.getElementById("wbtcToken");
    //         if (wbtcToken) {
    //             wbtcToken.addEventListener("click", openPopupTwitter);
    //         }
    //     }




    //     // if (!document.getElementById("uniqueId0")) {
    //     //     const outerDivx = document.createElement('div');
    //     //     outerDivx.id = 'uniqueId0';
    //     //     outerDivx.className = 'css-175oi2r r-1kbdv8c r-18u37iz r-1oszu61 r-3qxfft r-n7gxbd r-2sztyj r-1efd50x r-5kkj8d r-h3s6tt r-1wtj0ep';

    //     //     const svgIcon = `<svg width="30" height="30" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    //     //         <circle cx="25" cy="25" r="20" stroke="#061F30" stroke-width="5" fill="none"/>
    //     //         <circle cx="25" cy="25" r="20" stroke="#1D97EB" stroke-width="5" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round">
    //     //           <animateTransform attributeName="transform" type="rotate" values="0 25 25;360 25 25" dur="1s" repeatCount="indefinite"/>
    //     //         </circle>
    //     //       </svg>
    //     //       `;

    //     //     // Create a span for the loading text
    //     //     const loadingText = document.createElement('span');
    //     //     loadingText.textContent = 'Loading';
    //     //     loadingText.style.marginLeft = '10px'; // Add some space between the SVG and the text

    //     //     outerDivx.innerHTML = svgIcon;
    //     //     outerDivx.appendChild(loadingText);


    //     //     const targetElement = document.querySelector('.css-175oi2r.r-18u37iz.r-1udh08x.r-1c4vpko.r-1c7gwzm.r-1ny4l3l');


    //     //     // Insert outerDivx after the target element
    //     //     if (targetElement) {
    //     //         targetElement.insertAdjacentElement('afterend', outerDivx);
    //     //     }


    //     //     let dotCount = 0;
    //     //     loadingInterval = setInterval(() => {
    //     //         dotCount = (dotCount % 3) + 1;
    //     //         loadingText.textContent = `Loading${'.'.repeat(dotCount)}`;
    //     //     }, 10000);

    //     // }

    //     // document.getElementById('uniqueId0').remove();


    //     // Check if uniqueId0 already exists





    //     //     const newDiv = document.createElement('div');
    //     //     newDiv.id = "uniqueId6";
    //     //     const svgIcon = `<svg width="30" height="30" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    //     //     <circle cx="25" cy="25" r="20" stroke="#061F30" stroke-width="5" fill="none"/>
    //     //     <circle cx="25" cy="25" r="20" stroke="#1D97EB" stroke-width="5" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round">
    //     //       <animateTransform attributeName="transform" type="rotate" values="0 25 25;360 25 25" dur="1s" repeatCount="indefinite"/>
    //     //     </circle>
    //     //   </svg>`;

    //     //     newDiv.innerHTML = '<div class="flex flex-col"><h3>Sentiplex Summary</h3><p>' + svgIcon + '</p></div>';

    //     //     // Select the target element
    //     //     const targetElement = document.querySelector('.css-175oi2r.r-kemksi.r-1kqtdi0.r-1867qdf.r-1phboty.r-rs99b7.r-1ifxtd0.r-1udh08x');

    //     //     // Insert newDiv before targetElement
    //     //     targetElement.parentNode.insertBefore(newDiv, targetElement);


    //     // URLs for the APIs
    //     const url_1 = 'https://content-analysis.onrender.com/api/label-text';
    //     const url_2 = 'https://content-analysis.onrender.com/vision/gpt-4o';
    //     const url_3 = 'https://content-analysis.onrender.com/vision/mixtral-8x7b';
    //     const url_4 = 'https://content-analysis.onrender.com/vision/llama-3';
    //     const url_5 = 'https://content-analysis.onrender.com/onchain/send-message';
    //     const url_6 = 'https://content-analysis.onrender.com/vision/gpt-4o';

    //     // Data for the POST requests
    //     const data_1 = JSON.stringify({ text_inputs: [text_twitter] });
    //     const sumarize = "Give me a brief and crisp summary of this text: " + "'" + text_twitter + "'"
    //     text_twitter = "Give me an estimate of authenticity of this post. Don't give any explanations, just a number from 1 to 100: " + "'" + text_twitter + "'"
    //     console.log('text', text_twitter);
    //     const data_2 = JSON.stringify({ content: text_twitter });
    //     const data_3 = JSON.stringify({ content: text_twitter });
    //     const data_4 = JSON.stringify({ content: text_twitter });
    //     const data_5 = JSON.stringify({ message: text_twitter });
    //     const data_6 = JSON.stringify({ content: sumarize });

    //     // Fetch requests
    //     const fetch_1 = fetch(url_1, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_1 });
    //     const fetch_2 = fetch(url_2, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_2 });
    //     const fetch_3 = fetch(url_3, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_3 });
    //     const fetch_4 = fetch(url_4, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_4 });
    //     const fetch_5 = fetch(url_5, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_5 });
    //     const fetch_6 = fetch(url_6, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data_6 });


    //     Promise.all([fetch_1, fetch_2, fetch_3, fetch_4, fetch_5, fetch_6])
    //         .then(responses => Promise.all(responses.map(res => res.json())))
    //         .then(([data_1, data_2, data_3, data_4, data_5, data_6]) => {
    //             clearInterval(loadingInterval);
    //             // document.getElementById('uniqueId0').remove();
    //             // document.getElementById('uniqueId6').remove();

    //             console.log('twitter_Data from API 1:', data_1);
    //             console.log('Data from API 2:', data_2.content);
    //             console.log('Data from API 3:', data_3.content);
    //             console.log('Data from API 4:', data_4.content);
    //             console.log('Data from API 5:', data_5.response);
    //             console.log('Data from API 6:', data_6.content);

    //             // Step 1: Create an array with all values
    //             const values1 = [data_2.content, data_3.content, data_4.content, data_5.response]
    //                 .map(Number) // Convert all values to numbers
    //                 .filter(val => !isNaN(val) && val <= 100); // Filter out NaN values and values greater than 100

    //             // Step 3: Calculate the average of the remaining values
    //             const average1 = values1.length > 0 ? values1.reduce((acc, val) => acc + val, 0) / values1.length : 0;
    //             console.log('Average of twitter_post:', average1);


    //             // Check if the element already exists



    //             globalData1 = data_1;


    //             // if (!document.getElementById("uniqueId1")) {
    //             //     const outerDivx = document.createElement('div');
    //             //     outerDivx.id = 'uniqueId1';

    //             //     const svgIcon = getEmojiForLabel(globalData1.topics.label);

    //             //     outerDivx.innerHTML = svgIcon;
    //             //     outerDivx.title = globalData1.topics.label + ' ' + Math.round(globalData1.topics.score * 100) + '%';

    //             //     const targetElement = document.querySelector('#uniqueId0');
    //             //     targetElement.appendChild(outerDivx);


    //             // }

    //             // if (!document.getElementById("uniqueId2")) {

    //             //     const outerDivx = document.createElement('div');
    //             //     outerDivx.id = 'uniqueId2';

    //             //     const svgIcon = getEmojiForLabel(globalData1.sentiment.label);

    //             //     outerDivx.innerHTML = svgIcon;
    //             //     outerDivx.title = globalData1.sentiment.label + ' ' + Math.round(globalData1.sentiment.score * 100) + '%';

    //             //     const targetElement = document.querySelector('#uniqueId0');
    //             //     targetElement.appendChild(outerDivx);


    //             // }


    //             // if (!document.getElementById("uniqueId3")) {

    //             //     const outerDivx = document.createElement('div');
    //             //     outerDivx.id = 'uniqueId3';

    //             //     const svgIcon = getEmojiForLabel(globalData1.moderation.label);

    //             //     outerDivx.innerHTML = svgIcon;
    //             //     outerDivx.title = globalData1.moderation.label + ' ' + Math.round(globalData1.moderation.score * 100) + '%';

    //             //     const targetElement = document.querySelector('#uniqueId0');
    //             //     targetElement.appendChild(outerDivx);

    //             // }


    //             // if (!document.getElementById("uniqueId4")) {

    //             //     const outerDivx = document.createElement('div');
    //             //     outerDivx.id = 'uniqueId4';


    //             //     const svgIcon = getEmojiForLabel(globalData1.emotion.label);

    //             //     outerDivx.innerHTML = svgIcon;
    //             //     outerDivx.title = globalData1.emotion.label + ' ' + Math.round(globalData1.emotion.score * 100) + '%';

    //             //     const targetElement = document.querySelector('#uniqueId0');
    //             //     targetElement.appendChild(outerDivx);


    //             // }




    //             // if (!document.getElementById("uniqueButton")) {

    //             //     const outerDivx = document.createElement('div');
    //             //     outerDivx.id = 'uniqueButton';
    //             //     outerDivx.style.paddingTop = "10px";
    //             //     // Create the button element
    //             //     const button = document.createElement('button');
    //             //     button.innerHTML = "CreateMeme";  // Set button text
    //             //     button.id = "btn_unique";

    //             //     // Add inline style to match the button in the image
    //             //     button.style.backgroundColor = '#f2f2f2';  // Light background
    //             //     button.style.color = '#000';  // Black text
    //             //     button.style.border = '1px solid #d1d1d1';  // Light gray border
    //             //     button.style.padding = '8px 16px';  // Padding
    //             //     button.style.borderRadius = '20px';  // Rounded corners
    //             //     button.style.fontSize = '14px';  // Font size
    //             //     button.style.fontFamily = 'Arial, sans-serif';  // Font family
    //             //     button.style.cursor = 'pointer';  // Cursor change on hover
    //             //     button.style.outline = 'none';  // Remove outline on focus
    //             //     button.style.fontWeight = 'bold';
    //             //     // Add event listeners for hover and active states
    //             //     button.onmouseover = function () {
    //             //         button.style.backgroundColor = '#e0e0e0';  // Slightly darker on hover
    //             //     };

    //             //     button.onmouseout = function () {
    //             //         button.style.backgroundColor = '#f2f2f2';  // Revert to original color
    //             //     };

    //             //     button.onmousedown = function () {
    //             //         button.style.backgroundColor = '#d1d1d1';  // Darker when clicked
    //             //     };

    //             //     button.onmouseup = function () {
    //             //         button.style.backgroundColor = '#e0e0e0';  // Go back to hover state
    //             //     };

    //             //     button.onclick = function () {
    //             //         openPopupTwitter();
    //             //     };

    //             //     // Add the button to the div
    //             //     outerDivx.appendChild(button);

    //             //     const targetElement = document.querySelector('#uniqueId0');
    //             //     targetElement.appendChild(outerDivx);
    //             // }





    //             // const newDiv = document.createElement('div');
    //             // newDiv.id = "uniqueId6";
    //             // newDiv.innerHTML = '<div class="flex flex-col"><h3>Sentiplex Summary</h3><p>' + data_6.content + '</p></div>';

    //             // // Select the target element
    //             // const targetElement = document.querySelector('.css-175oi2r.r-kemksi.r-1kqtdi0.r-1867qdf.r-1phboty.r-rs99b7.r-1ifxtd0.r-1udh08x');

    //             // // Insert newDiv before targetElement
    //             // targetElement.parentNode.insertBefore(newDiv, targetElement);



    //         })
    //         .catch(error => {
    //             console.error('Error:', error);
    //         });







    // }


    // if (parts.length === 5) {
    //     let text = document.getElementsByClassName("flex flex-col whitespace-pre-wrap break-words text-lg leading-6 tracking-normal")[0].innerText
    //     console.log('text =========>>>>>>>>', text);
    //     // flex flex-col whitespace-pre-wrap break-words text-lg leading-6 tracking-normal

    //     let globalData = null;
    //     let loadingInterval = null;

    //     if (!document.getElementById("uniqueElementId0")) {
    //         const outerDiv = document.createElement('div');
    //         outerDiv.id = "uniqueElementId0"; // Set a unique ID for the outer div
    //         outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //         // group flex w-9 flex-row items-center text-sm text-faint cursor-pointer

    //         const innerDiv = document.createElement('div');
    //         innerDiv.className = "group flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //         // const svgIcon = `<svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><filter id="spinner-gF01"><feGaussianBlur in="SourceGraphic" stdDeviation="1" result="y"/><feColorMatrix in="y" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="z"/><feBlend in="SourceGraphic" in2="z"/></filter></defs><g filter="url(#spinner-gF01)"><circle fill="#1F51FF" cx="5" cy="12" r="4"><animate attributeName="cx" calcMode="spline" dur="2s" values="5;8;5" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite"/></circle><circle fill="#1F51FF" cx="19" cy="12" r="4"><animate attributeName="cx" calcMode="spline" dur="2s" values="19;16;19" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite"/></circle><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></g></svg>`;

    //         const svgIcon = `<svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#999999">
    //         <!-- Background circle with white stroke -->
    //         <circle cx="50" cy="50" r="45" stroke="#ffffff" stroke-width="5" fill="none" />

    //         <!-- Foreground animated circle -->
    //         <circle cx="50" cy="50" r="45" stroke="#999999" stroke-width="5" fill="none" stroke-dasharray="283" stroke-dashoffset="75">
    //           <animateTransform
    //             attributeName="transform"
    //             type="rotate"
    //             values="0 50 50;360 50 50"
    //             dur="1s"
    //             repeatCount="indefinite" />
    //         </circle>
    //       </svg>`;
    //         // Create a span for the loading text
    //         const loadingText = document.createElement('span');
    //         loadingText.textContent = 'Loading';
    //         loadingText.style.marginLeft = '10px'; // Add some space between the SVG and the text

    //         innerDiv.innerHTML = svgIcon;
    //         innerDiv.appendChild(loadingText);
    //         outerDiv.appendChild(innerDiv);

    //         const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //         targetElement.appendChild(outerDiv);


    //         let dotCount = 0;
    //         loadingInterval = setInterval(() => {
    //             dotCount = (dotCount % 3) + 1;
    //             loadingText.textContent = `Loading${'.'.repeat(dotCount)}`;
    //         }, 500);

    //     }

    //     const newDiv = document.createElement('div');
    //     newDiv.id = "uniqueElementId6";
    //     const svgIcon = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#999999">
    //     <!-- Background circle with white stroke -->
    //     <circle cx="50" cy="50" r="45" stroke="#F6F6F6" stroke-width="5" fill="none" />

    //     <!-- Foreground animated circle -->
    //     <circle cx="50" cy="50" r="45" stroke="#999999" stroke-width="5" fill="none" stroke-dasharray="283" stroke-dashoffset="75">
    //       <animateTransform
    //         attributeName="transform"
    //         type="rotate"
    //         values="0 50 50;360 50 50"
    //         dur="1s"
    //         repeatCount="indefinite" />
    //     </circle>
    //   </svg>`;

    //     newDiv.innerHTML = '<div class="mt-3 hidden rounded-lg px-2 py-3 pt-1.5 bg-overlay-light mdlg:block"><div class="px-2 py-1 text-lg font-semibold">The X Agent Summary</div><div class="flex justify-center items-center px-2 py-4 text-sm text-muted">' + svgIcon + '</div><div class="flex flex-col items-center pt-1"><button id="copyButton" class="rounded-lg font-semibold border bg-action-tertiary border-action-tertiary hover:bg-action-tertiary-hover hover:border-action-tertiary-hover active:border-action-tertiary-active disabled:border-action-tertiary disabled:text-action-tertiary-disabled disabled:hover:bg-action-tertiary disabled:active:border-action-tertiary px-4 py-2 text-sm w-full" disabled>Copy to clipboard</button></div></div>';
    //     newDiv.title = 'Summary: Loading...';

    //     const parentElement = document.querySelector('.sticky.top-0.hidden.h-full.flex-shrink-0.flex-grow.flex-col.sm\\:flex.sm\\:max-w-\\[330px\\].pt-3');
    //     parentElement.insertBefore(newDiv, parentElement.children[1]);

    //     // URLs for the APIs
    //     const url1 = 'https://content-analysis.onrender.com/api/label-text';
    //     const url2 = 'https://content-analysis.onrender.com/vision/gpt-4o';
    //     const url3 = 'https://content-analysis.onrender.com/vision/mixtral-8x7b';
    //     const url4 = 'https://content-analysis.onrender.com/vision/llama-3';
    //     const url5 = 'https://content-analysis.onrender.com/onchain/send-message';
    //     const url6 = 'https://content-analysis.onrender.com/vision/gpt-4o';

    //     // Data for the POST requests
    //     const data1 = JSON.stringify({ text_inputs: [text] });
    //     const sumarize = "Give me a brief and crisp summary of this text: " + "'" + text + "'"
    //     text = "Give me an estimate of authenticity of this post. Don't give any explanations, just a number from 1 to 100: " + "'" + text + "'"
    //     console.log('text', text);
    //     const data2 = JSON.stringify({ content: text });
    //     const data3 = JSON.stringify({ content: text });
    //     const data4 = JSON.stringify({ content: text });
    //     const data5 = JSON.stringify({ message: text });
    //     const data6 = JSON.stringify({ content: sumarize });

    //     // Fetch requests
    //     const fetch1 = fetch(url1, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data1 });
    //     const fetch2 = fetch(url2, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data2 });
    //     const fetch3 = fetch(url3, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data3 });
    //     const fetch4 = fetch(url4, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data4 });
    //     const fetch5 = fetch(url5, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data5 });
    //     const fetch6 = fetch(url6, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data6 });

    //     // Use Promise.all to wait for both fetch requests to complete
    //     Promise.all([fetch1, fetch2, fetch3, fetch4, fetch5, fetch6])
    //         .then(responses => Promise.all(responses.map(res => res.json())))
    //         .then(([data1, data2, data3, data4, data5, data6]) => {
    //             clearInterval(loadingInterval);
    //             document.getElementById('uniqueElementId0').remove();

    //             console.log('Data from API 1:', data1);
    //             console.log('Data from API 2:', data2.content);
    //             console.log('Data from API 3:', data3.content);
    //             console.log('Data from API 4:', data4.content);
    //             console.log('Data from API 5:', data5.response);
    //             console.log('Data from API 6:', data6.content);

    //             // Step 1: Create an array with all values
    //             const values = [data2.content, data3.content, data4.content, data5.response]
    //                 .map(Number) // Convert all values to numbers
    //                 .filter(val => !isNaN(val) && val <= 100); // Filter out NaN values and values greater than 100

    //             // Step 3: Calculate the average of the remaining values
    //             const average = values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0;
    //             console.log('Average:', average);

    //             // Check if the element already exists
    //             if (!document.getElementById("uniqueElementId0")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId0"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //                 let fillColor;

    //                 if (average > 70) {
    //                     fillColor = "#4CAF50"; // Green
    //                 } else if (average < 40) {
    //                     fillColor = "#F44336"; // Red
    //                 } else {
    //                     fillColor = "#FFEB3B"; // Yellow
    //                 }

    //                 const svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="${fillColor}"/></svg>`;

    //                 innerDiv.innerHTML = svgIcon;
    //                 innerDiv.title = 'GPT-4o: ' + data2.content + '%\n' + 'Mixtral-8x7b: ' + data3.content + '%\n' + 'Llama-3: ' + data4.content + '%\n' + 'Claude 3.5 Sonnet: ' + data5.response + '%';
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //             }

    //             globalData = data1;

    //             if (!document.getElementById("uniqueElementId1")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId1"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group text-xl flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //                 const svgIcon = getEmojiForLabel(globalData.topics.label);

    //                 innerDiv.innerHTML = svgIcon;
    //                 innerDiv.title = globalData.topics.label + ' ' + Math.round(globalData.topics.score * 100) + '%';
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //             }

    //             if (!document.getElementById("uniqueElementId2")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId2"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group text-xl flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group text-xl flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //                 const svgIcon = getEmojiForLabel(globalData.sentiment.label);

    //                 innerDiv.innerHTML = svgIcon;
    //                 innerDiv.title = globalData.sentiment.label + ' ' + Math.round(globalData.sentiment.score * 100) + '%';
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //             }

    //             if (!document.getElementById("uniqueElementId3")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId3"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group text-xl flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //                 const svgIcon = getEmojiForLabel(globalData.emotion.label);

    //                 innerDiv.innerHTML = svgIcon;
    //                 innerDiv.title = globalData.emotion.label + ' ' + Math.round(globalData.emotion.score * 100) + '%';
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //             }

    //             if (!document.getElementById("uniqueElementId4")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId4"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group text-xl flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium text-action-purple text-faint";

    //                 //const svgIcon = getEmojiForLabel(globalData.moderation.label);
    //                 const svgIcon = getIcon(globalData.moderation.label, globalData.moderation.score);

    //                 innerDiv.innerHTML = svgIcon;
    //                 innerDiv.title = globalData.moderation.label + ' ' + Math.round(globalData.moderation.score * 100) + '%';
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //             }

    //             if (!document.getElementById("uniqueElementId5")) {
    //                 const outerDiv = document.createElement('div');
    //                 outerDiv.id = "uniqueElementId5"; // Set a unique ID for the outer div
    //                 outerDiv.className = "group flex w-9 flex-row items-center text-sm text-faint cursor-pointer";

    //                 const innerDiv = document.createElement('div');
    //                 innerDiv.className = "group text-xl flex flex-row items-center justify-center rounded-full pt-2 transition-colors text-action-purple text-faint";

    //                 // Create the button element
    //                 const button = document.createElement('button');
    //                 button.textContent = "Create Meme";  // Set button text as "Cast"

    //                 // Add inline styles for the button
    //                 button.style.backgroundColor = "#7e57c2"; // Purple background
    //                 button.style.color = "white";             // White text
    //                 button.style.padding = "6px 6px";        // Padding
    //                 button.style.fontSize = "11px";           // Font size
    //                 button.style.border = "none";             // Remove border
    //                 button.style.borderRadius = "8px";        // Rounded corners
    //                 button.style.cursor = "pointer";
    //                 button.style.width = "120px"; // Pointer cursor on hover

    //                 // Add hover effect by using mouse events
    //                 button.onmouseover = function () {
    //                     button.style.backgroundColor = "#6c4bab";  // Darker purple on hover
    //                 };
    //                 button.onmouseout = function () {
    //                     button.style.backgroundColor = "#7e57c2";  // Original color when not hovering
    //                 };

    //                 // Add click event to show an alert
    //                 button.onclick = function () {
    //                     // alert( "Button was clicked!" );

    //                     openPoup();

    //                     // if (provider) {
    //                     //      openPoup();
    //                     // } else {
    //                     //      connectWallet();
    //                     // }

    //                 };

    //                 innerDiv.appendChild(button);
    //                 outerDiv.appendChild(innerDiv);

    //                 const targetElement = document.querySelector('.flex.flex-row.items-center.gap-3');
    //                 targetElement.appendChild(outerDiv);
    //                 // const targetElement = document.querySelector('.flex.flex-col.whitespace-pre-wrap.break-words.text-lg.leading-6.tracking-normal');
    //                 // targetElement.insertAdjacentElement('afterend', outerDiv);

    //             }



    //             const parentElement = document.getElementById('uniqueElementId6');
    //             // Modify the button element to include an ID for easy selection
    //             parentElement.innerHTML = '<div class="mt-3 hidden rounded-lg px-2 py-3 pt-1.5 bg-overlay-light mdlg:block"><div class="px-2 py-1 text-lg font-semibold">The X Agent Summary</div><div class="px-2 py-1 text-sm text-muted">' + data6.content + '</div><div class="flex flex-col items-center pt-1"><button id="copyToClipboardButton" class="rounded-lg font-semibold border bg-action-tertiary border-action-tertiary hover:bg-action-tertiary-hover hover:border-action-tertiary-hover active:border-action-tertiary-active disabled:border-action-tertiary disabled:text-action-tertiary-disabled disabled:hover:bg-action-tertiary disabled:active:border-action-tertiary px-4 py-2 text-sm w-full">Copy to clipboard</button></div></div>';

    //             // Ensure the DOM has been updated before trying to attach the event listener
    //             document.getElementById('copyToClipboardButton').addEventListener('click', function () {
    //                 // Use the Clipboard API to copy text
    //                 navigator.clipboard.writeText(data6.content).then(function () {
    //                     console.log('Content copied to clipboard successfully!');
    //                 }).catch(function (error) {
    //                     console.error('Error copying text: ', error);
    //                 });
    //             });

    //         })
    //         .catch(error => {
    //             console.error('Error:', error);
    //         });
    // }
}

function handleNewContent() {
    // Disconnect and reconnect observer to avoid infinite loops
    observer.disconnect();
    debouncedDoSomething();
    //observeDOMChanges();
}

function observeDOMChanges() {
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", debouncedDoSomething);
} else {
    debouncedDoSomething();
}

// Observe changes in the DOM
const observer = new MutationObserver(handleNewContent);
observeDOMChanges();

// Call listenCasts to initialize the listeners
//debouncedDoSomething();

// Testing metamask


