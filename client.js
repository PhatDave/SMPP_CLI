const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const NanoTimer = require("nanotimer");
const { createBaseLogger, createSessionLogger } = require("./logger");
const { verifyDefaults, verifyExists } = require("./utils");
const { clientOptions } = require("./cliOptions");

const logger = createBaseLogger();
const options = commandLineArgs(clientOptions);

if (options.help) {
	const usage = commandLineUsage([
		{
			header: "CLI SMPP (Client)",
		},
		{
			header: "Options",
			optionList: clientOptions,
		},
		{
			content: "Project home: {underline https://github.com/PhatDave/SMPP_CLI}",
		},
	]);
	console.log(usage);
	process.exit(0);
}

verifyDefaults(options, clientOptions);
verifyExists(options.host, "Host can not be undefined or empty! (--host)", logger);
verifyExists(options.port, "Port can not be undefined or empty! (--port)", logger);
verifyExists(options.systemid, "SystemID can not be undefined or empty! (--systemid)", logger);
verifyExists(options.password, "Password can not be undefined or empty! (--password)", logger);

let inFlight = 0;
let sent = 0;
let success = 0;
let failed = 0;
const sendTimer = new NanoTimer();

function startInterval(session, sessionLogger) {
	sendTimer.setInterval(
		async () => {
			if (sent >= options.messagecount) {
				sessionLogger.info(`Finished sending messages success:${success}, failed:${failed}, idling...`);
				sendTimer.clearInterval();
			} else if (inFlight < options.window) {
				sessionLogger.info(`Sending message ${sent + 1}/${options.messagecount}`);
				session.submit_sm(
					{
						source_addr: options.source,
						destination_addr: options.destination,
						short_message: options.message,
					},
					function (pdu) {
						inFlight--;
						if (pdu.command_status === 0) {
							sessionLogger.info(`Received response with id ${pdu.message_id}`);
							success++;
						} else {
							sessionLogger.warn(`Message failed with id ${pdu.message_id}`);
							failed++;
						}
					}
				);
				sent++;
				inFlight++;
			} else {
				sessionLogger.warn(
					`${inFlight}/${options.window} messages pending, waiting for a reply before sending more`
				);
				sendTimer.clearInterval();
				setTimeout(() => startInterval(session, sessionLogger), options.windowsleep);
			}
		},
		"",
		`${1 / options.mps} s`
	);
}

for (let i = 0; i < options.sessions; i++) {
	const sessionLogger = createSessionLogger(i);
	sessionLogger.info(`Connecting to ${options.host}:${options.port}...`);
	const session = smpp.connect(
		{
			url: `smpp://${options.host}:${options.port}`,
			auto_enquire_link_period: 10000,
			debug: options.debug,
		},
		function () {
			sessionLogger.info(
				`Connected, sending bind_transciever with systemId '${options.systemid}' and password '${options.password}'...`
			);
			session.bind_transceiver(
				{
					system_id: options.systemid,
					password: options.password,
				},
				function (pdu) {
					if (pdu.command_status === 0) {
						sessionLogger.info(
							`Successfully bound, sending ${options.messagecount} messages '${options.source}'->'${options.destination}' ('${options.message}')`
						);
						startInterval(session, sessionLogger);
						// TODO: Add error message for invalid systemid and password

						session.on("deliver_sm", function (pdu) {
							sessionLogger.info("Got deliver_sm, replying...");
							session.send(pdu.response());
						});
						session.on("enquire_link", function (pdu) {
							session.send(pdu.response());
						});
						session.on("close", function () {
							sessionLogger.error(`Session closed`);
							process.exit(1);
						});
						session.on("error", function (err) {
							sessionLogger.error(`Fatal error ${err}`);
							process.exit(1);
						});
					}
				}
			);
		}
	);
}
