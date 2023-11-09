const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const optionDefinitions = [
	{ name: "help", type: String, description: "Display this usage guide." },
	{ name: "host", alias: "h", type: String, description: "The host (IP) to connect to." },
	{ name: "port", alias: "p", type: Number, description: "The port to connect to." },
	{ name: "systemId", alias: "s", type: String, description: "SMPP related login info." },
	{ name: "password", alias: "pa", type: String, description: "SMPP related login info." },
	{
		name: "messageCount",
		alias: "mc",
		type: Number,
		description: "Number of messages to send; Optional, defaults to 1.",
	},
	{
		name: "source",
		alias: "src",
		type: String,
		description: "Source field of the sent messages.",
		defaultOption: "smppDebugClient",
	},
	{
		name: "destination",
		alias: "dst",
		type: String,
		description: "Destination field of the sent messages.",
		defaultOption: "smpp",
	},
	{
		name: "message",
		alias: "msg",
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
		}, {
			header: "Options",
			optionList: optionDefinitions
		},
		{
			content: "Project home: {underline }"
		}
	]);
	console.log(usage);
	process.exit(0);
}

try {
	host = String(host);
	port = Number(port);
	systemId = String(systemId);
	password = String(password);
	messageCount = Number(messageCount) || 1;
	source = source || "smppClientDebug";
	destination = destination || "smpp";
	message = message || "smpp debug message";
} catch (e) {
	console.log(`Invalid params: ˘${e}`);
	console.log(`Usage: client <host> <port> <systemId> <password> <messageCount?> <source?> <destination?> <message?>
	If not provided:
		messageCount defaults to 1 (value of 0 is permitted)
		source defaults to smppClientDebug
		destination defaults to smpp
		message defaults to "smpp debug message"
	Note:
		Host is in the form of IP
		Port must be a number
		MessageCount must be a number
	`);
	process.exit(0);
}

let message_id = 0;
console.log(`Connecting to ${host}:${port}...`);
const session = smpp.connect(
	{
		url: `smpp://${host}:${port}`,
		auto_enquire_link_period: 10000,
		debug: false,
	},
	function () {
		console.log("Connected, sending bind_transciever...");
		session.bind_transceiver(
			{
				system_id: systemId,
				password: password,
			},
			function (pdu) {
				if (pdu.command_status === 0) {
					// Successfully bound
					console.log("sending shit");
					session.submit_sm(
						{
							source_addr: "smpp_test_1",
							destination_addr: "123123123123",
							short_message: "Hello!",
							data_coding: 0xc0,
						},
						function (pdu) {
							if (pdu.command_status === 0) {
								console.log(pdu.message_id);
								message_id = pdu.message_id;
							}
						}
					);
				}
			}
		);
	}
);

session.on("deliver_sm", function (pdu) {
	console.log("Got deliver_sm");
	session.send(pdu.response());
});
