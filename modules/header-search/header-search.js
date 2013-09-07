define(['utils', 'playlist'], 'header-search', function(Utils, Playlist) {
    var SUGGEST_LIMIT = 10,
        currentSearchValue;

    function clearSearch() {
        this.value = '';
        this.parentNode.querySelector('.header-search__suggest').innerHTML = '';
    }
    function suggestItems() {
        var suggestNode = this.parentNode.querySelector('.header-search__suggest'),
            searchValue = this.value;

        currentSearchValue = searchValue;

        suggestNode.innerHTML = [
            '<li class="header-search__suggest-item">',
                '<img class="header-search__loader" src="/modules/header-search/header-search__loader.gif"',
            '</li>'
        ].join('')

        SC.get('/tracks', {q: searchValue, limit: 10}, function(tracks) {
            if (tracks.length && searchValue === currentSearchValue) {
                suggestNode.innerHTML = tracks.map(function (track) {
                    return [
                        '<li class="header-search__suggest-item" data-track="',
                        escape(JSON.stringify(track)),
                        '">',
                        track.title,
                        track.title,
                        '</li>'
                    ].join('');
                }).join('');
            }
        });
    }

    Utils.delegate('.header-search__suggest-item', 'touchstart', function () {
        Playlist.add(JSON.parse(unescape(this.dataset.track)));
    });
    Utils.delegate('.header-search__input', 'input', suggestItems);
    Utils.delegate('.header-search__input', 'touchstart', function () {
        this.onblur = clearSearch;
    });
});
