'use strict';
// refresh page
if (!querySelector('.custom_search')) app()

// we're tracking progress bar to know when all content we need is downloaded and then start our app
var $progressBar = querySelector('yt-page-navigation-progress')
var observer = new MutationObserver(mutations => {
    // check when progress bar dissapear - page content loaded
    if (mutations[0].attributeName === 'hidden') {
        if (!querySelector('.custom_search')) {
            app()
            observer.disconnect()
        }
    }
})
if ($progressBar) {
    observer.observe($progressBar, { 
      attributes: true, 
    })
}

// clear old changes on changes
if (querySelector('.custom_search__input')) querySelector('.custom_search__input').value = ''
if (querySelectorAll('.custom_search__stats')) querySelectorAll('.custom_search__stats').forEach(item => item.remove())
if (querySelector('.custom_search__support')) removeClass(querySelector('.custom_search__support'), 'custom_search__warning-visible')

function app() {
    // initial state
    let state = {
        // const
        limitIncreasing: 40,
        // can change
        numberOfResults: 0,
        resultsLimit: 40,
        isStopped: false,
    }
    // create copy of state with new values
    const setState = createObj(state)

    // youtube does not destroy old DOM when you change page, so, we need last of node list   
    const $wraps = querySelectorAll('ytd-playlist-sidebar-renderer')
    const $wrap = $wraps[$wraps.length - 1]
    const $resultsWRs = querySelectorAll('.ytd-section-list-renderer#contents')
    const $resultsWR = $resultsWRs[$resultsWRs.length - 1]

    // insert html where user going to input
    appendHtml($wrap, 'beforeend', templateInput)

    // inserted elements for later use
    const $searchWR = querySelector('.custom_search')
    const $warningMess = querySelector('.custom_search__empty')
    const $supportMess = querySelector('.custom_search__support')
    const $stopSearch = querySelector('.custom_search__stop')
    const $searchStatWR = querySelector('.custom_search__stat_wr')

    // init search on submitting form
    $searchWR.addEventListener('submit', e => {
        e.preventDefault()
        // get value of our input
        const inputVal = $searchWR.querySelector('.custom_search__input').value
        if (inputVal) {
            // reset prev changes if were
            setState({
                numberOfResults: 0,
                resultsLimit: state.limitIncreasing
            })
            // visual changes if was paused and not finished
            if (querySelector('.custom_search__inter')) querySelector('.custom_search__inter').remove()
            if (querySelector('.custom_result__link')) querySelector('.custom_result__link').remove()
            removeClass($supportMess, 'custom_search__warning-visible')
            // apply new search
            sendRequest(inputVal)
            // visual changes
            replaceHtml($resultsWR, templateWait)
            removeClass($stopSearch, 'custom_search__stop-hidden')
            $searchWR.querySelector('.custom_search__input').blur()
            $searchWR.querySelector('.custom_search__btn').blur()
        } else {
            // display warning for empty input
            addClass($warningMess, 'custom_search__warning-visible')
        }
    })
    // handle stop searching btn
    $stopSearch.addEventListener('click', e => {
        e.preventDefault()
        setState({ isStopped: true })
    })
    // handle input event 
    querySelector('.custom_search__input').addEventListener('input', e => removeClass($warningMess, 'custom_search__warning-visible'))
    // fill template with data
    const fillItem = item => {
        const ID = item.snippet.resourceId.videoId       
        const title = item.snippet.title 
        const thumbnail = item.snippet.thumbnails.default.url
        return resultTemplate(ID, title, thumbnail)
    }
    // filter array of results for needed word
    const filterItemForWord = (item, word) => { 
        const DATA_TITLE = item.snippet.title.toLowerCase()
        const DATA_DESC = item.snippet.description.toLowerCase()
        if (DATA_TITLE.includes(word) || DATA_DESC.includes(word)) {
            return item
        }
    }

    const displaySearchErr = (err, searchedWord) => {
        err.error.message.includes('authorized') ? replaceHtml($resultsWR, templateAuthErr) : replaceHtml($resultsWR, templateSearchErr)
        resetApp()
        querySelector('.custom_wait__auth').addEventListener('click', e => {
            e.preventDefault()
            replaceHtml($resultsWR, templateAuthComp)
            chrome.runtime.sendMessage({
                auth: true,
            }, response => 
                sendRequest(searchedWord))
        })
    }

    const sendRequest = (searchedWord, pageToken) => {
        const LIST_ID = window.location.href.split('=')[1]
        // current policy blocks api requests from content scripts. So we sending from background one
        chrome.runtime.sendMessage({
            sendQuery: true,
            listId: LIST_ID,
            pageToken: pageToken ? pageToken : null,
        }, data => 
            showResults(data, searchedWord)
        )
    }

    const showResults = (results, searchedWord) => {
        const nextPageToken = results.nextPageToken
        const items = results.items
        const word = searchedWord.toLowerCase()

        if (!items) {
            displaySearchErr(results, searchedWord)
            return
        }
        // todo: rework with composes
        const arr = filter(item => filterItemForWord(item, word), items)
        const htmlArr = map(fillItem, arr)
        htmlArr.map(item => {
            setState({ numberOfResults: state.numberOfResults + 1 })
            // visual changes
            if (querySelector('.custom_wait__message')) {
                replaceHtml($resultsWR)
            }
            appendHtml($resultsWR, 'beforeend', item)
        })

        // handle too much results
        if ((state.numberOfResults >= state.resultsLimit) && nextPageToken) {
            pauseSearch(searchedWord, nextPageToken)
            setState({ resultsLimit: state.resultsLimit + state.limitIncreasing })
            return
        }

        // youtube API has 50 results limit, so we recurs it until list finished
        if (nextPageToken && !state.isStopped) {
            sendRequest(searchedWord, nextPageToken)
        } else {
            // visual changes
            appendHtml($searchStatWR, 'afterbegin', displaynumberOfResults(searchedWord, state.numberOfResults))
            if (state.numberOfResults === 0) {
                replaceHtml($resultsWR, templateNoRes)
            }
            // remove old stats
            const prevSearchNumber = querySelectorAll('.custom_search__stats').length
            if (prevSearchNumber >= 8) querySelectorAll('.custom_search__stats')[prevSearchNumber - 1].remove()
            // reset changes to default
            resetApp()
        }
    }

    const resetApp = () => {
        setState({
            numberOfResults: 0,
            isStopped: false,
            resultsLimit: state.limitIncreasing
        })
        // visual changes
        addClass($stopSearch, 'custom_search__stop-hidden')
    }

    const pauseSearch = (searchedWord, nextPageToken) => {
        // visual changes
        appendHtml($resultsWR, 'beforeend', templateSearchBtn)
        appendHtml($searchStatWR, 'afterbegin', searchMore(state.numberOfResults))
        addClass($stopSearch, 'custom_search__stop-hidden')
        // handle continue
        querySelectorAll('.contSearch').forEach(node => node.addEventListener('click', e => {
            e.preventDefault()
            // visual changes
            querySelector('.custom_search__inter').remove()
            querySelector('.custom_result__link').remove()
            removeClass($stopSearch, 'custom_search__stop-hidden')
            // continue search
            sendRequest(searchedWord, nextPageToken)
        }))
    }
} 
