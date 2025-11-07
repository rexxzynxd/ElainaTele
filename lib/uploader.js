import fs from 'fs'

export async function Pomf2Uploader(buffer, filename = 'file.jpg') {
  const form = new FormData()
  form.append('files[]', new Blob([buffer]), filename)
  const res = await fetch('https://pomf2.lain.la/upload.php', {
    method: 'POST',
    body: form
  })
  const json = await res.json()
  if (!json.success) throw new Error('Upload gagal ke Pomf2')
  return json.files[0].url
}

export async function TelegraPhUploader(buffer) {
  const form = new FormData()
  form.append('file', new Blob([buffer]), 'image.jpg')
  const res = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: form
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return 'https://telegra.ph' + json[0].src
}

export async function UguuUploader(buffer, filename = 'file.jpg') {
  const form = new FormData()
  form.append('files[]', new Blob([buffer]), filename)
  const res = await fetch('https://uguu.se/upload.php', {
    method: 'POST',
    body: form
  })
  const json = await res.json()
  if (!json.files) throw new Error('Upload gagal ke Uguu')
  return json.files[0].url
}

export async function CatboxUploader(buffer, filename = 'file.jpg') {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', new Blob([buffer]), filename)
  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  })
  const url = await res.text()
  if (!url.startsWith('https://')) throw new Error('Upload gagal ke Catbox')
  return url.trim()
    }
