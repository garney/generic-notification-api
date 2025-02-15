const PORT = process.env.PORT || '6777';
const SOCKET_URL = `:${PORT}`;
const discordConfig = {
	"clientId": "731383064495915014",
	"guildId": "731383064495915010",
	"token": "MTA2MDc0OTg4ODg5NzQyNTQzOA.GLGTWQ.JZLh2Bm1Tc4APZIwKznGMx2uMmCcJuzQvhfhyk",
	"ozb_channel": "1061895047651545199",
	"filtered_channel": "1060752183081062440",
	"popmartChannel": "1331382505906897037"
}

module.exports = {
    PORT,
    SOCKET_URL,
    discordConfig
};

