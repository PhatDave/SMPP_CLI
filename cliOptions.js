const clientOptions = [
	{ name: "help", type: Boolean, description: "Display this usage guide." },
	{ name: "host", alias: "h", type: String, description: "The host (IP) to connect to." },
	{ name: "port", alias: "p", type: Number, description: "The port to connect to." },
	{ name: "systemid", alias: "s", type: String, description: "SMPP related login info." },
	{ name: "password", alias: "w", type: String, description: "SMPP related login info." },
	{ name: "sessions", type: Number, description: "Number of sessions to start, defaults to 1.", defaultOption: 1 },
	{
		name: "messagecount",
		type: Number,
		description: "Number of messages to send; Optional, defaults to 1.",
		defaultOption: 1,
	},
	{
		name: "window",
		type: Number,
		description:
			"Defines the amount of messages that are allowed to be 'in flight'. The client no longer waits for a response before sending the next message for up to <window> messages. Defaults to 100.",
		defaultOption: 100,
	},
	{
		name: "windowsleep",
		type: Number,
		description:
			"Defines the amount time (in ms) waited between retrying in the case of full window. Defaults to 100.",
		defaultOption: 100,
	},
	{
		name: "mps",
		type: Number,
		description: "Number of messages to send per second",
		defaultOption: 999999,
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
	{ name: "logs", type: Boolean, description: "Write logs (to stdout), defaults to true." },
	{
		name: "bars",
		type: Boolean,
		description: "Display TX and RX bars. Can be used with logs (although it will make a mess)."
	},
];

const centerOptions = [
	{ name: "help", type: Boolean, description: "Display this usage guide." },
	{ name: "port", alias: "p", type: Number, description: "The port to connect to." },
	{ name: "systemid", alias: "s", type: String, description: "SMPP related login info." },
	{ name: "password", alias: "w", type: String, description: "SMPP related login info." },
	{ name: "dr", type: Boolean, description: "Whether or not to send Delivery Reports.", defaultOption: false },
	{
		name: "randid",
		type: Boolean,
		description: "SMPP ID generation is entirely random instead of sequential.",
		defaultOption: false,
	},
	{
		name: "sessions",
		type: Number,
		description: "Maximum number of client sessions to accept, defaults to 8.",
		defaultOption: 8,
	},
	{
		name: "messagecount",
		type: Number,
		description: "Number of messages to send; Optional, defaults to 0.",
		defaultOption: 0,
	},
	{
		name: "window",
		type: Number,
		description:
			"Defines the amount of messages that are allowed to be 'in flight'. The client no longer waits for a response before sending the next message for up to <window> messages. Defaults to 100.",
		defaultOption: 100,
	},
	{
		name: "windowsleep",
		type: Number,
		description:
			"Defines the amount time (in ms) waited between retrying in the case of full window. Defaults to 100.",
		defaultOption: 100,
	},
	{
		name: "mps",
		type: Number,
		description: "Number of messages to send per second",
		defaultOption: 999999,
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
	{ name: "debug", type: Boolean, description: "Display all traffic to and from the center; Debug mode." },
	{ name: "logs", type: Boolean, description: "Write logs (to stdout), defaults to true." },
	{
		name: "bars",
		type: Boolean,
		description: "Display TX and RX bars. Can be used with logs (although it will make a mess)."
	},
];

module.exports = { clientOptions, centerOptions };
