var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    packer = require('./deploy/packer/packer'),
    deploy = require('deploy-utils').aws_deploy,
    argv = require('yargs').argv,
    merge = require('merge'),
    fs = require('fs');

DEVELOP_ENV_NAME = 'develop';

var existingAMI = false;

// --- VALIDATORS / HELPERS ---

function verifyBranch() {
    if(typeof(argv.branch) != 'string') {
        throw Error("Missing source branch (eg. --branch=release/v0.1.0)");
    }
}

function verifySourceAMI() {
    if(typeof(argv.source_ami) != 'string') {
        throw Error("Missing source AMI (eg. --source_ami=ami-7d242e4d)");
    }
}

function verifyEnvironment() {
    if(typeof(argv.environment) != 'string') {
        throw Error("Missing environment (eg. --environment=staging)");
    }
}

function verifyInstanceType() {
    if(typeof(argv.instance_type) != 'string') {
        throw Error("Missing instance type (eg. --instance_type=t2.micro)");
    }
}

function addPackerVars() {
    var varPath = 'deploy/packer/vars';
    var normalizedPath = require("path").join(__dirname, varPath);

    var res = {};
    fs.readdirSync(normalizedPath).forEach(function(file) {
        if (file.substr(-5) == '.json') {
            res = merge(require("./" + varPath + "/" + file), res);
        }
    });
    return res;
}

// --- TASKS ---

var application = require('./package').name
    , version = require('./package').version
    , amiName = application + "@" + version;

if (argv.environment == DEVELOP_ENV_NAME) {
    version = DEVELOP_ENV_NAME;
    var now = new Date().getTime();
    amiName = application + "@" + version + '-' + now;
}

gulp.task('jshint', function() {
    return gulp.src(['./app.js', './bin/www', './routes/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default', { verbose : true }))
        .pipe(jshint.reporter('fail'));
});

/**
 * Perform validation and feed data to the deploy module
 */
gulp.task('deploy_init', ['jshint'], function() {
    verifyBranch();
    verifySourceAMI();
    verifyEnvironment();
    verifyInstanceType();

    deploy.init({
        appName: application,
        awsRegion: argv.region || 'us-east-1',
        version: version,
        environment: argv.environment,
        instanceType: argv.instance_type
    });
});


/**
 * Check if the AMI for the app version being deployed already exists, and if so, skip the build step.
 * This is useful in cases where a build step succeeded during a prior failed deployment attempt or for rollbacks.
 */
gulp.task('checkAMI', ['jshint', 'deploy_init'], function(cb) {
    deploy.waitForAvailableAMI({ name: amiName, exactMatch: true }, function(err, res) {
        if (err)
            return cb(err);

        // no artifact found, invoke build
        else if (res.state == 'unknown') {
            console.log("No existing AMI with name " + amiName + " found, building...");
            return cb();
        }

        // artifact already exists, skip build
        else if (res.state == 'available') {
            console.warn("AMI with name " + amiName + " is already present, skipping build step...");
            existingAMI = true;
            return cb();
        }

        else {
            return cb("Unrecognized AMI state");
        }
    });
});

/**
 * Invoke Packer/Ansible to build a requested branch and create an AMI (artifact)
 */
gulp.task('build', ['jshint', 'deploy_init', 'checkAMI'], function() {
    if (!existingAMI) {
        return gulp.src('')
            .pipe(packer(merge(
                addPackerVars(),
                {
                    application: application,
                    ami_name: amiName,
                    branch: argv.branch,
                    source_ami: argv.source_ami,
                    instance_type: argv.instance_type,
                    environment: argv.environment
                }
            ), (argv.debug || null)))
    }
});

/**
 * Invoke the deploy module to update the given application environment, comprised of AWS resources
 * (ELB, Launch Configuration, Auto-Scaling Group, EC2 instances), with the new build
*/
gulp.task('deploy', ['jshint', 'deploy_init', 'checkAMI', 'build'], function(cb) {
    deploy.asDeploy(function(err) {
        return cb(err);
    });
});