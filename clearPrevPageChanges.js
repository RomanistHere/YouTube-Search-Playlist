var cleanScreen = () => {
    if (document.querySelector('.custom_search__inter')) document.querySelector('.custom_search__inter').remove()
    if (document.querySelector('.custom_result__link')) document.querySelector('.custom_result__link').remove()
    if (document.querySelector('.custom_search')) document.querySelector('.custom_search__input').value = ''
    if (document.querySelectorAll('.custom_search__stats')) document.querySelectorAll('.custom_search__stats').forEach(item => item.remove())
    setTimeout(() => {
    	if (document.querySelector('.custom_search__inter')) document.querySelector('.custom_search__inter').remove()
	    if (document.querySelector('.custom_result__link')) document.querySelector('.custom_result__link').remove()
	    if (document.querySelector('.custom_search')) document.querySelector('.custom_search__input').value = ''
	    if (document.querySelectorAll('.custom_search__stats')) document.querySelectorAll('.custom_search__stats').forEach(item => item.remove())
    }, 1000)
}

cleanScreen()