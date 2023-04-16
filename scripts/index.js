import { world, system, MinecraftDimensionTypes } from "@minecraft/server"
import { Database } from "./database"
const dB = new Database("ban")
if (!dB.has("banned")) {
    dB.all.banned = []
    dB.save()
}
export function ban(playerName, sec) {
    const player = dB.all.banned.find((p) => p.name === playerName)
    if (player) return false
    dB.all.banned.push({ name: playerName, time: sec, banTime: Date.now()})
    dB.save()
    return true
}

export function unban(playerName) {
    const player = dB.all.banned.find((p) => p.name === playerName)
    if (!player) return false
    dB.all.banned.splice(dB.all.banned.indexOf(player), 1)
    dB.save()
    return true
}

export function banList() {
    let banList = []
    for (const player of dB.all.banned) {
        banList.push(`§b${player.name} §7- §b${Math.floor((player.banTime + player.time * 1000 - Date.now()) / 1000)}§7 seconds left`)
    }
    return banList.join("\n")
}
const prefix = "."

world.events.beforeChat.subscribe((data) => {
    const { sender: player, message } = data
    const args = message.split(" ")
    if (!message.startsWith(prefix)) return
    if (!player.hasTag("staff")) return player.sendMessage(`§cYou are not allowed to use this command!`)
    data.cancel = true
    switch (args[0].replace(prefix, "")) {
        case "ban":
            if (args.length < 3) return player.sendMessage(`§cUsage: ${prefix}ban <time> <player>`)
            const time = Number(args[1])
            const banTarget = message.split(" ").slice(2).join(" ")
            if (!ban(banTarget, time)) return player.sendMessage(`§c${banTarget} is already banned!`)
            player.sendMessage(`§cBanned ${banTarget} for ${time} seconds!`)
            break
        case "unban":
            const unbanTarget = message.split(" ").slice(1).join(" ")
            if (args.length < 2) return player.sendMessage(`§cUsage: ${prefix}unban <player>`)
            if (!unban(unbanTarget)) return player.sendMessage(`§c${unbanTarget} is not banned!`)

            player.sendMessage(`§cUnbanned ${unbanTarget}!`)
            break
        case "banList":
            player.sendMessage(`§cBanned players: \n${banList().length > 0 ? banList() : "None"}`)
            break
        default: {
            player.sendMessage(`§cUnknown command!`)
            break
        }
    }
})

system.runInterval(() => {
    for (const player of dB.all.banned) {
        if (Date.now() > player.banTime + player.time * 1000) return unban(player.name)
        world.getDimension(MinecraftDimensionTypes.overworld).runCommandAsync(`kick "${player.name}" You are banned for ${(player.banTime + player.time * 1000) - Date.now()} seconds!`)
    }
})