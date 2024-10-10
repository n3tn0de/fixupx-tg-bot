import 'dotenv/config'

import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)

const welcome = async (ctx) => {
  console.log(ctx)
  ctx.reply([
    `Send me a twitter/x link, and I'll replace it with fixupx url`,
    `You can also add me to groups`,
    `I'm able to delete original messages to keep things clean.`,
    `However, you'll need to grant me 'Delete messages' admin permission` +
    `in your group`,
    `I'm a bit janky in channels, hopefully dev will fix this in the future.`,
    `Source code: https://github.com/n3tn0de/fixupx-tg-bot`
  ].join(`\n`))
}

bot.start(welcome)
bot.help(welcome)

const fixupxDomain = 'fixupx.com'
const fixUrl = `https://${fixupxDomain}`

const twitterUrlRegex =
  /(?<domain>(fixupx|x|twitter).com)\/(?<path>(?<account>.+)\/status\/(?<postId>\d+))/

bot.hears(twitterUrlRegex, async (ctx) => {
  const { match, telegram, update } = ctx
  const { message } = update
  const {
    message_id: messageId,
    chat, from: userInfo,
    entities,
    text,
    reply_to_message,
  } = message
  console.log(message)
  const { username } = userInfo
  const { id: chatId } = chat
  const { groups } = match
  const { domain, account, postId, path } = groups
  if (domain === fixupxDomain) {
    return
  }
  const result = [
    `${fixUrl}/${path}`,
    `Link posted by t.me/${username}`,
    `Original message:`
  ].join(`\n`)

  const origMsgSeparator = `\n\n`

  const newOffset = result.length + origMsgSeparator.length

  const updatedEntities = entities.map(entity => {
    const { offset, ...rest } = entity
    return({
      offset: offset + newOffset,
      ...rest
    })
  })

  const replyText = [
    result,
    text,
  ].join(origMsgSeparator)

  let replyOptions = {
    entities: updatedEntities,
    chat_id: chatId,
  }

  if (reply_to_message) {
    replyOptions = {
      ...replyOptions,
      reply_parameters: reply_to_message,
    }
  }

  try {
    await ctx.sendMessage(replyText, replyOptions)
    await telegram.deleteMessage(chatId, messageId)
  } catch(error) {
    console.error(error)
  }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
