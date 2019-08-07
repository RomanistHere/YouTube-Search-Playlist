'use strict';
// refresh
if (!document.querySelector('.custom_search')) ininInput()
// change
var $progressBar = document.querySelector('yt-page-navigation-progress')
var observer = new MutationObserver(mutations => {
    // check when progress bar dissapear - page content loaded
    if (mutations[0].attributeName === 'hidden') {
        if (!document.querySelector('.custom_search')) {
            ininInput()
            observer.disconnect()
        }
    }
})
if ($progressBar) {
    observer.observe($progressBar, { 
      attributes: true, 
    })
}
// clear old changes
if (document.querySelector('.custom_search__input')) document.querySelector('.custom_search__input').value = ''
if (document.querySelectorAll('.custom_search__stats')) document.querySelectorAll('.custom_search__stats').forEach(item => item.remove())
if (document.querySelector('.custom_search__support')) document.querySelector('.custom_search__support').classList.remove('custom_search__warning-visible')

function ininInput() {
    const limitIncreasing = 40
    // mutatable data
    let numberOfResults = 0
    let resultsLimit = limitIncreasing
    let isStopped = false

    // youtube does not destroy old DOM when you change page, so, we need last of node list   
    const $wraps = document.querySelectorAll('ytd-playlist-sidebar-renderer')
    const $wrap = $wraps[$wraps.length - 1]
    const $resultsWRs = document.querySelectorAll('.ytd-section-list-renderer#contents')
    const $resultsWR = $resultsWRs[$resultsWRs.length - 1]
    // html templates
    const templateInput =  `<form class="custom_search">
                                <div class="custom_search__wr">
                                    <a class="custom_search__stop custom_search__stop-hidden" href="#">Stop</a>
                                    <div class="custom_search__form" action="">
                                        <input placeholder="Search within playlist" type="text" class="custom_search__input">
                                    </div>
                                    <button class="custom_search__btn">Search</button>
                                    <p class="custom_search__warning custom_search__empty">Search for empty string is a bad idea</p>
                                    <p class="custom_search__warning custom_search__support">Make this playlist public or wait for next version of extension</p>                                    
                                </div>
                                <div class="custom_search__stat_wr"></div>
                            </form>`
    const templateWait =   `<div class="custom_wait">    
                                <p class="custom_wait__message">In searching...</p>
                                <div class="custom_wait__anim">
                                    <ul class="custom_wait__wr">
                                        <li class="custom_wait__item"></li>
                                        <li class="custom_wait__item"></li>
                                        <li class="custom_wait__item"></li>
                                    </ul>
                                </div>
                            </div>`
    $wrap.insertAdjacentHTML('beforeend', templateInput)

    const $searchWR = document.querySelector('.custom_search')
    const $warningMess = document.querySelector('.custom_search__empty')
    const $supportMess = document.querySelector('.custom_search__support')
    const $stopSearch = document.querySelector('.custom_search__stop')
    const $searchStatWR = document.querySelector('.custom_search__stat_wr')

    $searchWR.addEventListener('submit', e => {
        e.preventDefault()
        const inputVal = $searchWR.querySelector('.custom_search__input').value
        const $privateTag = document.querySelector('.badge.badge-style-type-simple.style-scope.ytd-badge-supported-renderer')
        if ($privateTag) {
            displaySupportMessage($privateTag)
        } else if (inputVal) {
            // reset
            numberOfResults = 0
            resultsLimit = limitIncreasing
            // if was paused and not finished
            if (document.querySelector('.custom_search__inter')) document.querySelector('.custom_search__inter').remove()
            if (document.querySelector('.custom_result__link')) document.querySelector('.custom_result__link').remove()
            $supportMess.classList.remove('custom_search__warning-visible')
            // apply new search
            sendRequest(inputVal)
            $resultsWR.innerHTML = templateWait
            $stopSearch.classList.remove('custom_search__stop-hidden')
            $searchWR.querySelector('.custom_search__input').blur()
            $searchWR.querySelector('.custom_search__btn').blur()
        } else {
            displayWarning()
        }
    })

    $stopSearch.addEventListener('click', e => {
        e.preventDefault()
        isStopped = true
    })

    const displayItems = item => {
        const thumbnail = item.snippet.thumbnails.default.url
        const title = item.snippet.title
        const ID = item.snippet.resourceId.videoId
        // template of result item
        const html =   `<a class="custom_result" href="/watch?v=${ID}" target="_blank">
                            <img class="custom_result__image" alt="${title}" src="${thumbnail}">
                            <span class="custom_result__title">${title}</span>
                        </a>`
        return html
    }

    const filterItemForWord = (item, word) => { 
        const DATA_TITLE = item.snippet.title.toLowerCase()
        const DATA_DESC = item.snippet.description.toLowerCase()
        if (DATA_TITLE.includes(word) || DATA_DESC.includes(word)) {
            return item
        }
    }

    const handleErr = err => {
        $resultsWR.innerHTML = `<div class="custom_wait">
                                    <p class="custom_wait__message">Oops! Something went wrong.</p>
                                </div>`
        numberOfResults = 0
        isStopped = false
        resultsLimit = limitIncreasing
        $stopSearch.classList.add('custom_search__stop-hidden')
    }

    const sendRequest = (searchedWord, pageToken) => {
        const LIST_ID = window.location.href.split('=')[1]
        // current policy blocks api requests from content scripts. Has to be from bg one
        chrome.runtime.sendMessage({
            sendQuery: true,
            listId: LIST_ID,
            pageToken: pageToken ? pageToken : null,
        }, data => 
            showResults(data, searchedWord)
        )
    }

    const showResults = (results, searchedWord) => {
        const NEXT_PAGE_TOKEN = results.nextPageToken
        const ITEMS = results.items
        const WORD = searchedWord.toLowerCase()

        if (!ITEMS) {
            handleErr()
            return
        }
        // for every response find if there needed items, then display
        const ARR = ITEMS.filter(item => filterItemForWord(item, WORD))
        const HTML_ARR = ARR.map(displayItems)

        HTML_ARR.map(item => {
            numberOfResults++

            if (document.querySelector('.custom_wait__message')) {
                $resultsWR.innerHTML = ''
            }
            $resultsWR.insertAdjacentHTML('beforeend', item)
        })
        // handle too much results
        if (numberOfResults >= resultsLimit) {
            pauseSearch(searchedWord, NEXT_PAGE_TOKEN)
            resultsLimit = resultsLimit + limitIncreasing 
            return
        }
        // youtube API has 50 results limit, so we recurs it until list finished
        if (NEXT_PAGE_TOKEN && !isStopped) {
            sendRequest(searchedWord, NEXT_PAGE_TOKEN)
        } else {
            $searchStatWR.insertAdjacentHTML('afterbegin', `<p class="custom_search__stats">Number of results for ${searchedWord}: ${numberOfResults}</p>`)
            if (numberOfResults === 0) {
                $resultsWR.innerHTML = `<div class="custom_wait">
                                            <p class="custom_wait__message">Nothing :(</p>
                                        </div>`
            }
            // remove old stats
            const prevSearchNumber = document.querySelectorAll('.custom_search__stats').length
            if (prevSearchNumber >= 8) document.querySelectorAll('.custom_search__stats')[prevSearchNumber - 1].remove()
            // reset changes to default
            numberOfResults = 0
            isStopped = false
            resultsLimit = limitIncreasing
            $stopSearch.classList.add('custom_search__stop-hidden')
        }
    }

    const pauseSearch = (searchedWord, NEXT_PAGE_TOKEN) => {
        $resultsWR.insertAdjacentHTML('beforeend', `<a class="custom_result__link contSearch" href="#">Show more</a>`)
        $searchStatWR.insertAdjacentHTML('afterbegin', `<div class="custom_search__inter">
                                                            <p class="custom_search__inter_text custom_search__stats">Searching paused. Found ${numberOfResults} or more results</p>
                                                            <a class="custom_search__inter_link contSearch" href="#">Show more</a>
                                                        </div>`)
        $stopSearch.classList.add('custom_search__stop-hidden')
        document.querySelectorAll('.contSearch').forEach(node => node.addEventListener('click', (e) => {
            // resume search
            e.preventDefault()
            document.querySelector('.custom_search__inter').remove()
            document.querySelector('.custom_result__link').remove()
            $stopSearch.classList.remove('custom_search__stop-hidden')
            sendRequest(searchedWord, NEXT_PAGE_TOKEN)
        }))
    }

    document.querySelector('.custom_search__input').addEventListener('input', evt => hideWarning())

    const displayWarning = () => {
        $warningMess.classList.add('custom_search__warning-visible')
    }

    const hideWarning = () => {
        $warningMess.classList.remove('custom_search__warning-visible')
    }

    const displaySupportMessage = ($privateTag) => {
        $supportMess.classList.add('custom_search__warning-visible')
        $privateTag.classList.add('badge-animated')
        setTimeout(() => {
            if ($privateTag) $privateTag.classList.remove('badge-animated')
        }, 1500)
    }
} 
