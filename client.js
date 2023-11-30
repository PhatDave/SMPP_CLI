const smpp = require("smpp");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const NanoTimer = require("nanotimer");
const { createBaseLogger, createSessionLogger } = require("./logger");
const { verifyDefaults, verifyExists } = require("./utils");
const { clientOptions } = require("./cliOptions");
const { MetricManager } = require("./metrics/metricManager");

const options = commandLineArgs(clientOptions);
const logger = createBaseLogger(options);

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
const metricManager = new MetricManager(options);

function startInterval(session, sessionLogger, metrics) {
	if (!metrics.progress && options.bars === true) {
		metrics.progress = metricManager.AddMetrics("Send progress", false);
		metrics.progress.bar.total = options.messagecount;
		metrics.window = metricManager.AddMetrics("Send window", false);
		metrics.window.bar.total = options.window;
	}
	sendTimer.setInterval(
		async () => {
			if (sent >= options.messagecount) {
				sessionLogger.info(`Finished sending messages success:${success}, failed:${failed}, idling...`);
				sendTimer.clearInterval();
			} else if (inFlight < options.window) {
				sessionLogger.info(`Sending message ${sent + 1}/${options.messagecount}`);
				if (options.bars) {
					metrics.progress.bar.increment();
					metrics.window.bar.increment();
				}
				session.submit_sm(
					{
						source_addr: options.source,
						destination_addr: options.destination,
						short_message: options.message,
					},
					function (pdu) {
						if (metrics.window?.bar) {
							metrics.window.bar.update(metrics.window.bar.value - 1);
						}
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
				if (metrics.txMetrics) {
					metrics.txMetrics.AddEvent();
				}
				sent++;
				inFlight++;
			} else {
				sessionLogger.warn(
					`${inFlight}/${options.window} messages pending, waiting for a reply before sending more`
				);
				sendTimer.clearInterval();
				setTimeout(() => startInterval(session, sessionLogger, metrics), options.windowsleep);
			}
		},
		"",
		`${1 / options.mps} s`
	);
}

for (let i = 0; i < options.sessions; i++) {
	const sessionLogger = createSessionLogger(options, i);
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
						const rxMetrics = metricManager.AddMetrics(`Session-${i}-RX`);
						const txMetrics = metricManager.AddMetrics(`Session-${i}-TX`);
						startInterval(session, sessionLogger, {
							rxMetrics,
							txMetrics,
						});
						// TODO: Add error message for invalid systemid and password

						session.on("deliver_sm", function (pdu) {
							if (rxMetrics) {
								rxMetrics.AddEvent();
							}
							sessionLogger.info("Got deliver_sm, replying...");
							// setTimeout(() => {
							// 	session.send(pdu.response());
							// 	txMetrics.AddEvent();
							// }, 200);
							session.send(pdu.response());
							if (txMetrics) {
								txMetrics.AddEvent();
							}
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
