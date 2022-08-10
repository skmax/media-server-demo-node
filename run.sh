#!/usr/bin/env sh

node index.js 127.0.0.1 | grep '>DTLSICETransport::Probe()' > medooze.log