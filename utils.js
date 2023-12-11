const smpp = require("smpp");

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

function getCharacterSizeForEncoding(pdu) {
	let encoding = pdu.data_coding;
	if (!encoding) {
		encoding = 0;
	}
	let characterSizeBits = 0;
	switch (encoding) {
		case 0:
			characterSizeBits = 7;
			break;
		case 1:
			characterSizeBits = 8;
			break;
		case 8:
			characterSizeBits = 16;
			break;
	}
	return characterSizeBits;
}

const maxMessageSizeBits = 1120;
function splitToParts(pdu) {
	const charSize = getCharacterSizeForEncoding(pdu);
	const maxMessageLength = maxMessageSizeBits / charSize;

	const splitMessage = [];
	const message = pdu.short_message;
	const messageLength = message.length;
	const messageCount = (messageLength / maxMessageLength) | 0;
	for (let i = 0; i < messageCount; i++) {
		splitMessage.push(message.slice(i * maxMessageLength, i * maxMessageLength + maxMessageLength));
	}

	const pdus = splitMessage.map((messagePart, index) => {
		let udh = Buffer.from([0x05, 0x00, 0x03, this.iterator++, messageCount, index + 1]);

		let partPdu = new smpp.PDU(pdu.command, { ...pdu });
		partPdu.short_message = {
			udh: udh,
			message: messagePart,
		};
		return partPdu;
	});
	return pdus;
}

// TODO: Add "uselongsms" switch to options;
async function sendPdu(session, pdu, logger, uselongsms) {
	return new Promise((resolve, reject) => {
		if (uselongsms) {
			const pdus = splitToParts(pdu);
			logger.info(`Sending long sms of ${pdus.length} parts`);
			const total = pdus.length;
			let success = 0;
			let failed = 0;
			const promises = pdus.map((pdu) => {
				return new Promise((resolve, reject) => {
					session.send(pdu, (respPdu) => {
						if (respPdu.command_status === 0) {
							resolve(respPdu);
						} else {
							reject(respPdu);
						}
					});
				});
			});
			Promise.all(promises)
				.then((responses) => {
					resolve(responses[0]);
				})
				.catch((error) => {
					reject(error);
				});
		} else {
			session.send(pdu, (respPdu) => {
				if (respPdu.command_status === 0) {
					resolve(respPdu);
				} else {
					reject(respPdu);
				}
			});
		}
	});
}

module.exports = { verifyDefaults, verifyExists, sendPdu, splitToParts, getCharacterSizeForEncoding };
