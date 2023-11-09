const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const defaultFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});
const sessionFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [Session ${label}] ${level}: ${message}`;
});
function createBaseLogger() {
	return createLogger({
		format: combine(format.colorize({ all: true }), timestamp(), defaultFormat),
		transports: [new transports.Console()],
	});
}
function createSessionLogger(label) {
	return createLogger({
		format: combine(label({ label: label }), format.colorize({ all: true }), timestamp(), sessionFormat),
		transports: [new transports.Console()],
	});
}

module.exports = { createBaseLogger, createSessionLogger };
