'use strict';

// handle install
chrome.runtime.onInstalled.addListener(function(details){
	//call a function to handle a first install
    if(details.reason == "install"){
		// chrome.storage.sync.set({"tutorial": true})

		// open website
		chrome.tabs.create({url: "https://romanisthere.github.io/YouTube-PLAS-Website/"})

    } else if(details.reason == "update"){

    }
})

// handle tab switch
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.getSelected(null,function(tab) {
	    let url = tab.url
	    if (url && url.includes("chrome://")) {
			chrome.browserAction.disable(activeInfo.tabId)
		}
   })
})

// handle tab update
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
	if ((changeInfo.status === 'complete') || (changeInfo.status === 'loading')) {
		let url = tab.url
		if (url) {
			if (url.includes("chrome://")) {
				chrome.browserAction.disable(tabId)
			} else {
				let youTubeURL = "www.youtube.com/playlist?list="
				if (url.includes(youTubeURL)) {
					chrome.tabs.executeScript(
			        	tabId,
			          	{file: 'clearPrevPageChanges.js'}
			        )
					chrome.tabs.executeScript(
			        	tabId,
			          	{file: 'config.js'}
			        )
					chrome.tabs.executeScript(
			        	tabId,
			          	{file: 'templates.js'}
			        )
					chrome.tabs.executeScript(
			        	tabId,
			          	{file: 'functions.js'}
			        )
					chrome.tabs.executeScript(
			        	tabId,
			          	{file: 'index.js'}
			        )
					chrome.tabs.insertCSS(
			        	tabId,
			          	{file: 'index.css'}
			        )			        
			    }
			}
		}
	}	
})
// todo: redo this gloabal variabling
let authToken = ''

chrome.runtime.onMessage.addListener(
  	function(request, sender, sendResponse) {
	    if (request.sendQuery === true) {
			const query = getQuery(request)
			fetch(query)
				.then(response => response.json())
		        .then(sendResponse)
		        .catch(sendResponse)
			return true
	    }
	    if (request.auth === true) {
	    	chrome.identity.getAuthToken({ 'interactive': true }, token => {
			  	authToken = token ? token : ''
			  	sendResponse('<3')
			})
			return true
	    }
})

const getQuery = (data) => {
	const url = 'https://www.googleapis.com/youtube/v3/playlistItems'
	const params = {
        part: 'snippet',
        access_token: authToken,
        playlistId: data.listId,
        key: config.YT_API_KEY,
        maxResults: 50,
        pageToken: data.pageToken ? data.pageToken : '',
    }
    // maiking fetch api usable
    const esq = encodeURIComponent
    const query = Object.keys(params)
        .map(k => esq(k) + '=' + esq(params[k]))
        .join('&')
    // ready query
    return url + '?' + query
}
