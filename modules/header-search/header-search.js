/*jshint white: false */
/**
 * Search block.  Responsible for a search suggest,
 * and adding tracks from suggest to the playlist
 */
define(['utils', 'playlist'], 'header-search', function (Utils, Playlist) {
    var SUGGEST_LIMIT = 5,
        // Stores last search value,
        // used to eliminate obsolete search queries callbacks
        currentSearchValue;

    function clearSearch() {
        var input = document.querySelector('.header-search__input');

        input.value = '';
        input.parentNode.querySelector('.header-search__suggest').innerHTML = '';
    }
    function suggestItems() {
        var suggestNode = this.parentNode.querySelector('.header-search__suggest'),
            searchValue = this.value;

        currentSearchValue = searchValue;

        if (this.value !== '') {
            //show loader, while loading
            suggestNode.innerHTML = [
                '<li class="header-search__suggest-item">',
                    '<img class="loader" src="modules/loader/loader.gif" />',
                '</li>'
            ].join('');

            // Search only for streamable tracks
            SC.get('/tracks', {q: searchValue, limit: SUGGEST_LIMIT, streamable: true}, function(tracks) {
                // Don't display belated results of previous search queries
                if (tracks.length && searchValue === currentSearchValue) {
                    suggestNode.innerHTML = tracks.map(function (track) {
                        return [
                            '<li class="header-search__suggest-item" data-track="',
                            encodeURI(JSON.stringify(track)),
                            '">',
                            track.title,
                            track.title,
                            '</li>'
                        ].join('');
                    }).join('');
                }
            });
        } else {
            clearSearch();
        }
    }

    Utils.delegate('.header-search__suggest-item', 'touchstart', function () {
        Playlist.add(JSON.parse(decodeURI(this.dataset.track)));
        clearSearch();
    });
    Utils.delegate('.header-search__input', 'input', suggestItems);
    Utils.delegate('.header-search__input', 'touchstart', function () {
        this.onblur = clearSearch;
    });
});
