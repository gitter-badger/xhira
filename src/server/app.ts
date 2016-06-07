import * as config from './lib/Configuration';

export function start() : void {
    console.log('started... ' + config.getValue());
}

