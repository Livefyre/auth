/**
 * @fileoverview Very small jsonp implementation.
 */

function req(url, callback) {
    var rand = '_lfcallback_' + (+new Date()),
        script = document.createElement('script'),
        sep = url.indexOf('?') > 0 ? '&' : '?';

    function clean() {
        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
        window[rand] = undefined;
    }

    window[rand] = function(data) {
        clean();
        callback(null, data);
    };

    script.type = 'text/javascript';
    script.async = true;

    script.onerror = function() {
        clean();
        callback('error');
    };

    script.src = url + sep + 'callback=' + rand;
    document.getElementsByTagName('head')[0].appendChild(script);
}

module.exports = {
    req: req
};
