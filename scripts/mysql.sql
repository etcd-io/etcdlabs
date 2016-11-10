
SHOW DATABASES;

CREATE SCHEMA IF NOT EXISTS etcdlabs;

SHOW DATABASES;


DROP TABLE etcdlabs.metrics;
CREATE TABLE IF NOT EXISTS etcdlabs.metrics (
	name           VARCHAR(100) NOT NULL,
	total_case     INT DEFAULT 0,
	total_failed   INT DEFAULT 0,
	current_case   INT DEFAULT 0,
	current_failed INT DEFAULT 0,
	last_update    DATETIME NOT NULL,
	PRIMARY KEY(name)
);
DESCRIBE etcdlabs.metrics;

-- 8,000 failure injections per day
INSERT INTO etcdlabs.metrics (name, total_case, current_case, current_failed, last_update)
VALUES ("3-node", 2640000, 0, 0, NOW()),
("5-node", 1500000, 0, 0, NOW()),
("3-node-failpoints", 1000000, 0, 0, NOW()),
("5-node-failpoints", 1000000, 0, 0, NOW())
;

SELECT *
FROM etcdlabs.metrics
LIMIT 10;
