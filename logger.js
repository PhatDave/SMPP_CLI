const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const defaultFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});
const sessionFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [Session ${label}] ${level}: ${message}`;
});
function createBaseLogger(options) {
	const logger = createLogger({
		format: combine(format.colorize({ all: true }), timestamp(), defaultFormat),
		transports: [new transports.Console()],
	});

	const oldInfo = logger.info;
	const oldWarn = logger.info;
	const oldError = logger.error;
	logger.info = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldInfo(input);
	};
	logger.error = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldError(input);
	};
	logger.warn = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldWarn(input);
	};

	return logger;
}
function createSessionLogger(options, ilabel) {
	const logger = createLogger({
		format: combine(label({ label: ilabel }), format.colorize({ all: true }), timestamp(), sessionFormat),
		transports: [new transports.Console()],
	});

	const oldInfo = logger.info;
	const oldWarn = logger.info;
	const oldError = logger.error;
	logger.info = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldInfo(input);
	};
	logger.error = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldError(input);
	};
	logger.warn = function (input) {
		if (!shouldLog(options)) {
			return;
		}
		oldWarn(input);
	};

	return logger;
}

function shouldLog(options) {
	return options.logs || !options.bars;
}

module.exports = { createBaseLogger, createSessionLogger };
