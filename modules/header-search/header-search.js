/**
 * Search block.  Responsible for a search suggest,
 * and adding tracks from suggest to the playlist
 */
define(['utils', 'playlist'], 'header-search', function(Utils, Playlist) {
    var SUGGEST_LIMIT = 10,
        // Stores last search value,
        // used to eliminate obsolete search queries callbacks
        currentSearchValue;

    function clearSearch() {
        this.value = '';
        this.parentNode.querySelector('.header-search__suggest').innerHTML = '';
    }
    function suggestItems() {
        var suggestNode = this.parentNode.querySelector('.header-search__suggest'),
            searchValue = this.value;

        currentSearchValue = searchValue;

        //show loader, while loading
        suggestNode.innerHTML = [
            '<li class="header-search__suggest-item">',
                '<img class="header-search__loader" src="modules/header-search/header-search__loader.gif"',
            '</li>'
        ].join('')

        // Search only for streamable tracks
        SC.get('/tracks', {q: searchValue, limit: 10, streamable: true}, function(tracks) {
            // Don't display belated results of previous search queries
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
