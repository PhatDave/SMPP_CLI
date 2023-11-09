const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const NanoTimer = require("nanotimer");
const { createBaseLogger, createSessionLogger } = require("./logger");
const { verifyDefaults, verifyExists } = require("./utils");
const { centerOptions } = require("./cliOptions");

const logger = createBaseLogger();
const options = commandLineArgs(centerOptions);

if (options.help) {
	const usage = commandLineUsage([
		{
			header: "CLI SMPP (Center)",
		},
		{
			header: "Options",
			optionList: centerOptions,
		},
		{
			content: "Project home: {underline https://github.com/PhatDave/SMPP_CLI}",
		},
	]);
	console.log(usage);
	process.exit(0);
}

verifyDefaults(options, centerOptions);
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
				logger.info(`Finished sending messages success:${success}, failed:${failed}, idling...`);
				sendTimer.clearInterval();
			} else if (inFlight < options.window) {
				sessionLogger.info(`Sending message ${sent + 1}/${options.messagecount}`);
				session.deliver_sm(
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

logger.info(`Staring server on port ${options.port}...`);
let sessionid = 1;
let messageid = 0;
const server = smpp.createServer(
	{
		debug: options.debug,
	},
	function (session) {
		const sessionLogger = createSessionLogger(sessionid++);

		session.on("bind_transceiver", function (pdu) {
			if (pdu.system_id === options.systemid && pdu.password === options.password) {
				sessionLogger.info("Client connected");
				session.send(pdu.response());
				startInterval(session, sessionLogger);
			} else {
				sessionLogger.warn(
					`Client tried to connect with incorrect login ('${pdu.system_id}' '${pdu.password}'`
				);
				pdu.response({
					command_status: smpp.ESME_RBINDFAIL,
				});
				session.close();
			}
		});
		session.on("enquire_link", function (pdu) {
			session.send(pdu.response());
		});
		session.on("submit_sm", async function (pdu) {
			if (!options.dr) {
				sessionLogger.info("Replying to incoming submit_sm");
				session.send(pdu.response());
				return;
			}

			sessionLogger.info("Generating DR for incoming submit_sm");
			let response = pdu.response();
			response.message_id = (messageid++).toString(16);
			session.send(response);

			let drMessage = "";
			let date = new Date()
				.toISOString()
				.replace(/T/, "")
				.replace(/\..+/, "")
				.replace(/-/g, "")
				.replace(/:/g, "")
				.substring(2, 12);

			drMessage += "id:" + response.message_id + " ";
			drMessage += "sub:001 ";
			drMessage += "dlvrd:001 ";
			drMessage += "submit date:" + date + " ";
			drMessage += "done date:" + date + " ";
			drMessage += "stat:DELIVRD ";
			drMessage += "err:000 ";
			drMessage += "text:";

			const DRPdu = {
				source_addr: pdu.source_addr,
				destination_addr: pdu.destination_addr,
				short_message: drMessage,
				esm_class: 4,
			};
			sessionLogger.info(`Generated DR as ${drMessage}`);
			session.deliver_sm(DRPdu);
		});

		session.on("close", function () {
			sessionLogger.warn(`Session closed`);
			session.close();
		});
		session.on("error", function (err) {
			sessionLogger.error(`Fatal error ${err}`);
			session.close();
		});
	}
);

server.on("error", function (err) {
	logger.error(`Fatal server error ${err}`);
	server.close();
	process.exit(1);
});

server.listen(options.port);
logger.info(`SMPP Server listening on ${options.port}`);
// const session = smpp.connect(
// 	{
// 		url: `smpp://${options.host}:${options.port}`,
// 		auto_enquire_link_period: 10000,
// 		debug: options.debug,
// 	},
// 	function () {
// 		logger.info(
// 			`Connected, sending bind_transciever with systemId '${options.systemid}' and password '${options.password}'...`
// 		);
// 		session.bind_transceiver(
// 			{
// 				system_id: options.systemid,
// 				password: options.password,
// 			},
// 			function (pdu) {
// 				if (pdu.command_status === 0) {
// 					logger.info(
// 						`Successfully bound, sending ${options.messagecount} messages '${options.source}'->'${options.destination}' ('${options.message}')`
// 					);
// 					startInterval(session);

// 					session.on("deliver_sm", function (pdu) {
// 						logger.info("Got deliver_sm, replying...");
// 						session.send(pdu.response());
// 					});
// 					session.on("close", function () {
// 						logger.error(`Session closed`);
// 						process.exit(1);
// 					});
// 					session.on("error", function (err) {
// 						logger.error(`Fatal error ${err}`);
// 						process.exit(1);
// 					});
// 				}
// 			}
// 		);
// 	}
// );