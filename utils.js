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

module.exports = { verifyDefaults, verifyExists };
