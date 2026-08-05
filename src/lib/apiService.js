/**
 * apiService — centralized API layer wrapping the Base44 SDK (entities, integrations, auth, users).
 * Every call routes errors through the centralized errorHandler so call sites get
 * consistent logging + user-friendly messages while still receiving thrown errors
 * to handle in their own try/catch.
 */
import { base44 } from '@/api/base44Client';
import { logError } from '@/lib/errorHandler';

function wrap(promise, context = {}) {
  return promise.catch((err) => {
    logError(err, context);
    throw err;
  });
}

function entityOps(name) {
  const e = base44.entities[name];
  if (!e) throw new Error(`apiService: unknown entity "${name}"`);
  return {
    list: (sort, limit) => wrap(e.list(sort, limit), { entity: name, op: 'list' }),
    get: (id) => wrap(e.get(id), { entity: name, op: 'get' }),
    filter: (query, sort, limit) => wrap(e.filter(query, sort, limit), { entity: name, op: 'filter' }),
    create: (data) => wrap(e.create(data), { entity: name, op: 'create' }),
    update: (id, data) => wrap(e.update(id, data), { entity: name, op: 'update' }),
    delete: (id) => wrap(e.delete(id), { entity: name, op: 'delete' }),
    bulkCreate: (items) => wrap(e.bulkCreate(items), { entity: name, op: 'bulkCreate' }),
    bulkUpdate: (items) => wrap(e.bulkUpdate(items), { entity: name, op: 'bulkUpdate' }),
    updateMany: (query, setOps) => wrap(e.updateMany(query, setOps), { entity: name, op: 'updateMany' }),
    deleteMany: (query) => wrap(e.deleteMany(query), { entity: name, op: 'deleteMany' }),
    subscribe: (cb) => e.subscribe(cb),
    schema: () => e.schema(),
  };
}

export const apiService = {
  entities: entityOps,
  integrations: {
    invokeLLM: (payload) => wrap(base44.integrations.Core.InvokeLLM(payload), { op: 'invokeLLM' }),
    sendEmail: (payload) => wrap(base44.integrations.Core.SendEmail(payload), { op: 'sendEmail' }),
    uploadFile: (file) => wrap(base44.integrations.Core.UploadFile({ file }), { op: 'uploadFile' }),
    generateImage: (prompt, existing) => wrap(base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: existing }), { op: 'generateImage' }),
    generateSpeech: (text, voice, language_code) => wrap(base44.integrations.Core.GenerateSpeech({ text, voice, language_code }), { op: 'generateSpeech' }),
    generateVideo: (prompt, opts = {}) => wrap(base44.integrations.Core.GenerateVideo({ prompt, ...opts }), { op: 'generateVideo' }),
    transcribeAudio: (audio_url) => wrap(base44.integrations.Core.TranscribeAudio({ audio_url }), { op: 'transcribeAudio' }),
    extractData: (file_url, json_schema) => wrap(base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema }), { op: 'extractData' }),
  },
  auth: {
    me: () => base44.auth.me(),
    isAuthenticated: () => base44.auth.isAuthenticated(),
    logout: (redirect) => base44.auth.logout(redirect),
    redirectToLogin: (next) => base44.auth.redirectToLogin(next),
    updateMe: (data) => base44.auth.updateMe(data),
  },
  users: {
    invite: (email, role) => wrap(base44.users.inviteUser(email, role), { op: 'inviteUser' }),
  },
};

export { getUserMessage } from '@/lib/errorHandler';