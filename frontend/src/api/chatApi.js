import client from './client'

export async function login(username, avatarColor) {
  const { data } = await client.post('/users/login', { username, avatarColor })
  return data
}

export async function getChannels() {
  const { data } = await client.get('/channels')
  return data
}

export async function createChannel(name) {
  const { data } = await client.post('/channels', { name })
  return data
}

export async function deleteChannel(id) {
  await client.delete(`/channels/${id}`)
}

export async function getMessages(channelId) {
  const { data } = await client.get(`/channels/${channelId}/messages`)
  return data
}

export async function deleteMessage(messageId, userId) {
  const { data } = await client.delete(`/messages/${messageId}`, { params: { userId } })
  return data
}

export async function getOnlineUsers() {
  const { data } = await client.get('/presence')
  return data
}
