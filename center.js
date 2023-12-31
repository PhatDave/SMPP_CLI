const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const NanoTimer = require("nanotimer");
const { createBaseLogger, createSessionLogger } = require("./logger");
const { verifyDefaults, verifyExists, sendPdu } = require("./utils");
const { centerOptions } = require("./cliOptions");
const crypto = require("crypto");
const { MetricManager } = require("./metrics/metricManager");

const options = commandLineArgs(centerOptions);
const logger = createBaseLogger(options);

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
const metricManager = new MetricManager(options);

// TODO: Currently bars are broken
// A major rework will need to happen before bars are able to play nice with multiple sessions
// TODO: Fix issue where only one session is being utilized because they all share the same timer
// TODO: Maybe add only receiver and only transmitter modes instead of transciever
// Instead just use the same timer but make a pool of connections; That way both problems will be solved
function startInterval(sessions, sessionLogger, rxMetrics) {
	if (!options.messagecount > 0) {
		sessionLogger.info("No messages to send");
		return;
	}
	let sessionPointer = 0;
	sendTimer.setInterval(
		async () => {
			if (sent >= options.messagecount) {
				sessionLogger.info(`Finished sending messages success:${success}, failed:${failed}, idling...`);
				sendTimer.clearInterval();
			} else if (inFlight < options.window) {
				sessionLogger.info(`Sending message ${sent + 1}/${options.messagecount}`);
				const pdu = new smpp.PDU("deliver_sm", {
					source_addr: options.source,
					destination_addr: options.destination,
					short_message: options.message,
				});

				if (sessionPointer >= sessions.length) {
					sessionPointer = 0;
				}
				sendPdu(sessions[sessionPointer++], pdu, sessionLogger, options.longsms)
					.then((resp) => {
						inFlight--;
						sessionLogger.info(`Received response with id ${resp.message_id}`);
						success++;
					})
					.catch((resp) => {
						inFlight--;
						sessionLogger.warn(`Message failed with id ${resp.message_id}`);
						failed++;
					});
				sent++;
				inFlight++;
			} else {
				sessionLogger.warn(
					`${inFlight}/${options.window} messages pending, waiting for a reply before sending more`
				);
				sendTimer.clearInterval();
				setTimeout(() => startInterval(sessions, sessionLogger), options.windowsleep);
			}
		},
		"",
		`${1 / options.mps} s`
	);
}

logger.info(`Staring server on port ${options.port}...`);
let sessionid = 1;
let messageid = 0;
const sessions = [];
const server = smpp.createServer(
	{
		debug: options.debug,
	},
	function (session) {
		const id = sessionid++;
		const sessionLogger = createSessionLogger(options, id);
		const rxMetrics = metricManager.AddMetrics(`Session-${id}-RX`);
		const txMetrics = metricManager.AddMetrics(`Session-${id}-TX`);

		session.on("bind_transceiver", function (pdu) {
			if (pdu.system_id === options.systemid && pdu.password === options.password) {
				sessions.push(session);
				sessionLogger.info(`Client connected, currently: ${sessions.length}`);
				session.send(pdu.response());
				startInterval(sessions, sessionLogger);
			} else {
				sessionLogger.warn(
					`Client tried to connect with incorrect login ('${pdu.system_id}' '${pdu.password}')`
				);
				pdu.response({
					command_status: smpp.ESME_RBINDFAIL,
				});
				session.close();
			}
		});
		session.on("bind_transmitter", function (pdu) {
			if (pdu.system_id === options.systemid && pdu.password === options.password) {
				sessionLogger.info("Client connected");
				session.send(pdu.response());
				startInterval(session, sessionLogger, rxMetrics);
			} else {
				sessionLogger.warn(
					`Client tried to connect with incorrect login ('${pdu.system_id}' '${pdu.password}')`
				);
				pdu.response({
					command_status: smpp.ESME_RBINDFAIL,
				});
				session.close();
			}
		});
		session.on("bind_receiver", function (pdu) {
			if (pdu.system_id === options.systemid && pdu.password === options.password) {
				sessionLogger.info("Client connected");
				session.send(pdu.response());
				startInterval(session, sessionLogger);
			} else {
				sessionLogger.warn(
					`Client tried to connect with incorrect login ('${pdu.system_id}' '${pdu.password}')`
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
				if (options.bars) {
					rxMetrics.AddEvent();
				}
				// setTimeout(() => {
				// 	session.send(pdu.response());
				// }, 200);
				session.send(pdu.response());
				return;
			}

			sessionLogger.info("Generating DR for incoming submit_sm");
			let response = pdu.response();

			let smppid = messageid++;
			if (options.randid) {
				smppid = crypto.randomBytes(8).toString("hex");
			}

			response.message_id = smppid.toString(16);
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
				source_addr: pdu.destination_addr,
				destination_addr: pdu.source_addr,
				short_message: drMessage,
				esm_class: 4,
			};
			sessionLogger.info(`Generated DR as ${drMessage}`);
			session.deliver_sm(DRPdu);
			if (txMetrics) {
				txMetrics.AddEvent();
			}
		});

		session.on("close", function () {
			sessions.splice(sessions.indexOf(session), 1);
			sessionLogger.warn(`Session closed, now ${sessions.length}`);
			session.close();
			if (sessions.length === 0) {
				sessionLogger.info("No more sessions, stopping sending timer");
				sendTimer.clearInterval();
			}
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
