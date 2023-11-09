const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
	format: combine(format.colorize(), timestamp(), myFormat),
	transports: [new transports.Console()],
});

function verifyExists(value, err) {
	if (!value) {
		logger.error(err);
		process.exit(0);
	}
}

const optionDefinitions = [
	{ name: "help", type: Boolean, description: "Display this usage guide." },
	{ name: "host", alias: "h", type: String, description: "The host (IP) to connect to." },
	{ name: "port", alias: "p", type: Number, description: "The port to connect to." },
	{ name: "systemId", alias: "s", type: String, description: "SMPP related login info." },
	{ name: "password", alias: "w", type: String, description: "SMPP related login info." },
	{
		name: "messageCount",
		type: Number,
		description: "Number of messages to send; Optional, defaults to 1.",
		defaultOption: 1,
	},
	{
		name: "source",
		type: String,
		description: "Source field of the sent messages.",
		defaultOption: "smppDebugClient",
	},
	{
		name: "destination",
		type: String,
		description: "Destination field of the sent messages.",
		defaultOption: "smpp",
	},
	{
		name: "message",
		type: String,
		description: "Text content of the sent messages.",
		defaultOption: "smpp debug message",
	},
	{ name: "debug", type: Boolean, description: "Display all traffic to and from the client; Debug mode." },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
	const usage = commandLineUsage([
		{
			header: "CLI SMPP (Client)",
		},
		{
			header: "Options",
			optionList: optionDefinitions,
		},
		{
			content: "Project home: {underline https://github.com/PhatDave/SMPP_CLI}",
		},
	]);
	console.log(usage);
	process.exit(0);
}

verifyExists(options.host, "Host can not be undefined or empty! (--host)");
verifyExists(options.port, "Port can not be undefined or empty! (--port)");
verifyExists(options.systemId, "SystemID can not be undefined or empty! (--systemId)");
verifyExists(options.password, "Password can not be undefined or empty! (--password)");

let message_id = 0;
logger.info(`Connecting to ${options.host}:${options.port}...`);
const session = smpp.connect(
	{
		url: `smpp://${options.host}:${options.port}`,
		auto_enquire_link_period: 10000,
		debug: options.debug,
	},
	function () {
		logger.info(
			`Connected, sending bind_transciever with systemId '${options.systemId}' and password '${options.password}'...`
		);
		session.bind_transceiver(
			{
				system_id: options.systemId,
				password: options.password,
			},
			function (pdu) {
				if (pdu.command_status === 0) {
					logger.info(
						`Successfully bound, sending ${options.messageCount} messages '${options.source}'->'${options.destination}' ('${options.message}')`
					);
					// session.submit_sm(
					// 	{
					// 		source_addr: "smpp_test_1",
					// 		destination_addr: "123123123123",
					// 		short_message: "Hello!",
					// 		data_coding: 0xc0,
					// 	},
					// 	function (pdu) {
					// 		if (pdu.command_status === 0) {
					// 			console.log(pdu.message_id);
					// 			message_id = pdu.message_id;
					// 		}
					// 	}
					// );
				}
			}
		);
	}
);

session.on("deliver_sm", function (pdu) {
	console.log("Got deliver_sm");
	session.send(pdu.response());
});
