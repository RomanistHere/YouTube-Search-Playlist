var templateInput = `<form class="custom_search">
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

var templateWait = `<div class="custom_wait">    
                        <p class="custom_wait__message">In searching...</p>
                        <div class="custom_wait__anim">
                            <ul class="custom_wait__wr">
                                <li class="custom_wait__item"></li>
                                <li class="custom_wait__item"></li>
                                <li class="custom_wait__item"></li>
                            </ul>
                        </div>
                    </div>`

var templateSearchErr = `<div class="custom_wait">
                            <p class="custom_wait__message">Oops! Something went wrong.</p>
                        </div>`

var templateNoRes = `<div class="custom_wait">
                        <p class="custom_wait__message">Nothing :(</p>
                    </div>`

var templateSearchBtn = `<a class="custom_result__link contSearch" href="#">Show more</a>`

var resultTemplate = (ID, title, thumbnail) =>
   `<a class="custom_result" href="/watch?v=${ID}" target="_blank">
        <img class="custom_result__image" alt="${title}" src="${thumbnail}">
        <span class="custom_result__title">${title}</span>
    </a>`

var displaynumberOfResults = (searchedWord, numberOfResults) =>
    `<p class="custom_search__stats">Number of results for ${searchedWord}: ${numberOfResults}</p>`

var searchMore = (numberOfResults) => 
    `<div class="custom_search__inter">
        <p class="custom_search__inter_text custom_search__stats">Searching paused. Found ${numberOfResults} or more results</p>
        <a class="custom_search__inter_link contSearch" href="#">Show more</a>
    </div>`