var shell = require('gulp-shell');

function uservars(cfg) {
    var vars = [];
    for(var key in cfg) {
        vars.push("-var '" + key + "=" + cfg[key] + "'");
    }
    return vars.join(' ');
}

module.exports = function(cfg, debug_flag) {
    var debug = (debug_flag) ? ' -debug' : '';
    return shell([
        'packer build ' + uservars(cfg) + debug + ' deploy/packer/packer.json'
    ]);
};