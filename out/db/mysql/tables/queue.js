"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moniker = {
    name: 'moniker',
    code: [
        "`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "moniker varchar(200)",
        "`in` tinyint default 0",
        "`out` tinyint default 0",
        "UNIQUE INDEX moniker_id(`moniker`, `id`)",
    ],
};
const queueIn = {
    name: 'queue_in',
    code: [
        "`id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "`moniker` INT NOT NULL",
        "`body` TEXT NOT NULL",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ]
};
const queueInFailed = {
    name: 'queue_in_failed',
    code: [
        "`id` BIGINT(20) NOT NULL PRIMARY KEY",
        "`reason` TEXT",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
    ]
};
const queueOut = {
    name: 'queue_out',
    code: [
        "`id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "`moniker` INT NOT NULL",
        "`body` TEXT NOT NULL",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ]
};
const queueP = {
    name: 'queue_p',
    code: [
        "moniker INT NOT NULL",
        "queue_in BIGINT NOT NULL DEFAULT 0",
        "queue_out BIGINT NOT NULL DEFAULT 0",
        "PRIMARY KEY(moniker)"
    ]
};
const notify = {
    name: 'notify',
    code: [
        "moniker INT NOT NULL",
        "notifiedAt TIMESTAMP NOT NULL",
        "`errors` smallint NOT NULL default 0",
        "PRIMARY KEY(moniker)"
    ]
};
exports.default = [
    moniker, queueIn, queueInFailed, queueOut, queueP, notify
];
//# sourceMappingURL=queue.js.map