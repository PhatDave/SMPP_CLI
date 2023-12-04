function verifyExists(value, err, logger) {
	if (!value) {
		logger.error(err);
		process.exit(0);
	}
}
function verifyDefaults(options, definitions) {
	for (const optionDefinition of definitions) {
		if (optionDefinition.defaultOption) {
			if (!options[optionDefinition.name]) {
				options[optionDefinition.name] = optionDefinition.defaultOption;
			}
		}
	}
}

async function sendPdu(session, pdu) {
	return new Promise((resolve, reject) => {
		session.send(pdu, (respPdu) => {
			if (respPdu.command_status === 0) {
				resolve(respPdu);
			} else {
				reject(respPdu);
			}
		});
	});
}

module.exports = { verifyDefaults, verifyExists, sendPdu };
