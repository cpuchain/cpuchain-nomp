var Stratum = require('./stratum');
var ShareProcessor = require('./shareProcessor.js');

module.exports = function(logger){
    var poolConfigs  = JSON.parse(process.env.pools);

    var forkId = process.env.forkId;
    
    var pools = {};

    //Handle messages from master process sent via IPC
    process.on('message', function(message) {
        switch(message.type){
            case 'banIP':
                for (var p in pools){
                    if (pools[p].stratumServer)
                        pools[p].stratumServer.addBannedIP(message.ip);
                }
                break;
        }
    });

    Object.keys(poolConfigs).forEach(function(coin) {
        var poolOptions = poolConfigs[coin];

        var logSystem = 'Pool';
        var logComponent = coin;
        var logSubCat = 'Thread ' + (parseInt(forkId) + 1);

        var shareProcessor = new ShareProcessor(logger, poolOptions);

        var handlers = {
            auth: function(){},
            share: function(){},
            diff: function(){}
        };

        handlers.auth = function(port, workerName, password, authCallback){
            if (workerName.length === 40) {
                try {
                    Buffer.from(workerName, 'hex');
                    authCallback(true);
                }
                catch (e) {
                    authCallback(false);
                }
            } else {
                var daemon = pool.daemon;

                daemon.cmd('validateaddress', [workerName], function (results) {
                    var isValid = results.filter(function (r) {
                        return r.response.isvalid
                    }).length > 0;
                    authCallback(isValid);
                });
            }
        };

        handlers.share = function(isValidShare, isValidBlock, data){
            shareProcessor.handleShare(isValidShare, isValidBlock, data);
        };

        var authorizeFN = function (ip, port, workerName, password, callback) {
            handlers.auth(port, workerName, password, function(authorized){
                var authString = authorized ? 'Authorized' : 'Unauthorized ';

                logger.debug(logSystem, logComponent, logSubCat, authString + ' ' + workerName + ':' + password + ' [' + ip + ']');
                callback({
                    error: null,
                    authorized: authorized,
                    disconnect: false
                });
            });
        };

        var pool = Stratum.createPool(poolOptions, authorizeFN, logger);
        pool.on('share', function(isValidShare, isValidBlock, data) {
            var shareData = JSON.stringify(data);

            if (data.blockHash && !isValidBlock) {
                logger.debug(logSystem, logComponent, logSubCat, 'We thought a block was found but it was rejected by the daemon, share data: ' + shareData);
            } else if (isValidBlock) {
                logger.debug(logSystem, logComponent, logSubCat, 'Block found: ' + data.blockHash + ' by ' + data.worker);
            }

            if (isValidShare) {
                if (data.shareDiff > 1000000000) {
                    logger.debug(logSystem, logComponent, logSubCat, 'Share was found with diff higher than 1.000.000.000!');
                } else if (data.shareDiff > 1000000) {
                    logger.debug(logSystem, logComponent, logSubCat, 'Share was found with diff higher than 1.000.000!');
                }

                logger.debug(logSystem, logComponent, logSubCat, 'Share accepted at diff ' + data.difficulty + '/' + data.shareDiff + ' by ' + data.worker + ' [' + data.ip + ']' );
            } else {
                logger.debug(logSystem, logComponent, logSubCat, 'Share rejected: ' + shareData);
            }

            handlers.share(isValidShare, isValidBlock, data)

        }).on('difficultyUpdate', function(workerName, diff) {
            logger.debug(logSystem, logComponent, logSubCat, 'Difficulty update to diff ' + diff + ' workerName=' + JSON.stringify(workerName));
            handlers.diff(workerName, diff);

        }).on('log', function(severity, text) {
            logger[severity](logSystem, logComponent, logSubCat, text);

        }).on('banIP', function(ip, worker){
            process.send({type: 'banIP', ip: ip});

        });

        pool.start();
        pools[poolOptions.coin.name] = pool;
    });

    this.getFirstPoolForAlgorithm = function(algorithm) {
        var foundCoin = "";
        Object.keys(poolConfigs).forEach(function(coinName) {
            if (poolConfigs[coinName].coin.algorithm == algorithm) {
                if (foundCoin === "")
                    foundCoin = coinName;
            }
        });
        return foundCoin;
    };
};
